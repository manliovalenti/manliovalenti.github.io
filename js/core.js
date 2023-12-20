/** 
 * 
 * Copyright (c) 2021 Manlio Valenti
 * 
 * Based on the following github project:
 * https://github.com/enric1994/bibtexonline
 * 
 * Copyright (c) 2020 Enric Moreu
 * 
 *  
 * MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
*/



// VARIABLES

var papers = document.getElementById("papers");
var thesis = document.getElementById("thesis");


// HELPERS

// Function to compile LaTeX special characters to HTML
var htmlify = function (str) {
    if (!str) { return ''; }
    str = str.replace(/\\"\{a\}/g, '&auml;')
        .replace(/\{\\aa\}/g, '&aring;')
        .replace(/\\aa\{\}/g, '&aring;')
        .replace(/\\"a/g, '&auml;')
        .replace(/\\"\{o\}/g, '&ouml;')
        .replace(/\\'e/g, '&eacute;')
        .replace(/\\'\{e\}/g, '&eacute;')
        .replace(/\\'a/g, '&aacute;')
        .replace(/\\`a/g, '&agrave;')
        .replace(/\\'A/g, '&Aacute;')
        .replace(/\\"o/g, '&ouml;')
        .replace(/\\"u/g, '&uuml;')
        .replace(/\\ss\{\}/g, '&szlig;')
        // .replace(/\{/g, '')
        // .replace(/\}/g, '')
        .replace(/\\&/g, '&')
        .replace(/--/g, '&ndash;');
    return str;
};

var uriencode = function (str) {
    if (!str) { return ''; }
    str = str.replace(/\\"\{a\}/g, '%C3%A4')
        .replace(/\{\\aa\}/g, '%C3%A5')
        .replace(/\\aa\{\}/g, '%C3%A5')
        .replace(/\\"a/g, '%C3%A4')
        .replace(/\\"\{o\}/g, '%C3%B6')
        .replace(/\\'e/g, '%C3%A9')
        .replace(/\\'\{e\}/g, '%C3%A9')
        .replace(/\\'a/g, '%C3%A1')
        .replace(/\\'A/g, '%C3%81')
        .replace(/\\"o/g, '%C3%B6')
        .replace(/\\"u/g, '%C3%BC')
        .replace(/\\ss\{\}/g, '%C3%9F')
        .replace(/\{/g, '')
        .replace(/\}/g, '')
        .replace(/\\&/g, '%26')
        .replace(/--/g, '%E2%80%93');
    return str;
};

// Function to get initials from authors
function get_initials(name) {
    initials = []
    words = name.split('-')
    for (var index = 0; index < words.length; index++) {
        word = words[index];
        initial = word[0];
        initials.push(initial);
    }
    return initials
}

// Function to get authors in a particular format from citations
function authors2html(authorData, vformat) {
    var authorsStr = '';
    var author;
    if (!authorData) { return authorsStr; }
    for (var index = 0; index < authorData.length; index++) {
        if (vformat == 'mla' && index > 0) { authorsStr += " et al"; break; } // MLA: Azcona, David, et al. 
        if (index > 0 ) { 
            if (vformat == 'amslike' && authorData.length==2 ) {authorsStr += " ";} // separate with a comma only if there are more than 2 authors
            else {authorsStr += ", ";} // For more than one author, separate them with a comma
        } 
        if (index > 0 && index == authorData.length - 1) { // Before adding the last author, add '&'' or 'and' if needed
            if (vformat == 'apa') { authorsStr += "& "; } // & Smeaton, A.
            else if (vformat == 'chicago' || vformat == 'amslike' || vformat == 'harvard') { authorsStr += "and "; } // and Alan Smeaton
        }
        // Get author
        author = authorData[index];
        if (vformat == 'mla' || vformat == 'chicago') {
            if (index == 0) { authorsStr += author.last + ", " + author.first; } // First: Azcona, David
            else { authorsStr += author.first + ((author.first && author.last) ? ", " : "") + author.last; } // Rest: Piyush Arora
        }
        else if (vformat == 'amslike' ) {
            authorsStr += author.first + " " + author.last;
        }
        else {
            initials = get_initials(author.first)
            if (vformat == 'vancouver') { separator = ""; } // Azcona, D
            else { separator = "."; } // Azcona, D.
            authorsStr += author.last + ((author.first) ? ", " + initials.join(separator) + separator : "");
        }
    }
    return htmlify(authorsStr);
}

function howpublished2readable(howpublished){
    var howpublishedStr = '';
    if (howpublished && howpublished.startsWith("\\url{") && howpublished.endsWith("}")) {
        var uri = howpublished.split("\\url{")[1].split("}")[0];
        howpublishedStr = '<a href="' + uri + '" target="_blank">' + uri + '</a>';
    }
    return htmlify(howpublishedStr);
}

// Function to format the citation based on the format selected
function format(data) {

    // Format value: MLA, APA, Chicago, Harvard, Vancouver, AMSLIKE
//    var formatValue = formatDropdown.options[formatDropdown.selectedIndex].value;
    var formatValue = "amslike";

    // Format authors
    var authors = authors2html(data.author, formatValue);

    // http://bib-it.sourceforge.net/help/fieldsAndEntryTypes.php#article
    // ARTICLE
    // An article from a journal or magazine.
    // Required fields: author, title, journal, year.
    // Optional fields: volume, number, pages, month, note.
    if (data.entryType == "article") {
        authors = ((authors) ? authors : "Authors are required!");
        var title = ((data.title) ? data.title : "<strong style='color:red;'>Title is required!</strong>");
        var journal = ((data.journal) ? data.journal : "<strong style='color:red;'>Journal is required!</strong>")
        var year = ((data.year) ? data.year : "<strong style='color:red;'>Year is required!</strong>")
        if (formatValue == 'mla') {
            return authors +
                ". \"" + title + "\". " +
                "<em>" + journal + "<\/em>" +
                ((data.volume) ? " " + data.volume : "") +
                ". " +
                ((data.number) ? " " + data.number : "") + 
                "(" + year + ")" +
                ((data.pages) ? ": " + data.pages : "") +
                ".";
        }
        else if (formatValue == 'apa') {
            return authors +
                " (" + year + "). " + 
                title + 
                "<em>" + ". " + journal + 
                ((data.volume) ? ", <em>" + data.volume : "") +
                "<\/em>" +
                ((data.number) ? "(" + data.number + ")" : "") + 
                ((data.pages) ? ", " + data.pages : "") +
                ".";
        }
        else if (formatValue == 'chicago') {
            return authors +
                ". \"" + title + "\". " + 
                "<em>" + journal + "<\/em>" + 
                ((data.volume) ? " " + data.volume : "") +
                ((data.number) ? ", no.&nbsp;" + data.number : "") + 
                "&nbsp;(" + year + ")" + 
                ((data.pages) ? ":&nbsp;" + data.pages : "") +
                ((data.doi) ? ", doi:&nbsp;" + data.doi : "") +                
                ".";
        }
        else if (formatValue == 'amslike') {
            return authors +
                ", <em>" + title + "<\/em>" + 
                ", " + journal + "" + 
                ((data.volume) ? " " + data.volume : "") +
                "&nbsp;(" + year + ")" + 
                ((data.number) ? ", no.&nbsp;" + data.number : "") + 
                ((data.pages) ? ",&nbsp;" + data.pages : "") +
                ((data.doi && data.url) ? ", doi:&nbsp;<a href=\""+ data.url +"\">"+ data.doi + "</a>" : "") +                
//                ((data.doi) ? ", doi:&nbsp;" + data.doi : "") +                
                ".";
        }
        else if (formatValue == 'harvard') {
            return authors +
                " " + year + 
                ". " + title + 
                ". <em>" + journal + 
                ((data.volume) ? ", " + data.volume : "") +
                "<\/em>" + 
                ((data.number) ? "(" + data.number + ")" : "") + 
                ((data.pages) ? ", p." + data.pages : "") + 
                ".";
        }
        else if (formatValue == 'vancouver') {
            return authors +
                ". \"" + title + "\". " +
                journal + " " +
                year +
                ((data.volume) ? "; " + data.volume : "") +
                ((data.number) ? "(" + data.number + ")" : "") +
                ((data.pages) ? ":" + data.pages : "") + 
                ".";
        }
    }
    // IN PROCEEDINGS
    // An article in a conference proceedings.
    // Required fields: author, title, booktitle, year.
    // Optional fields: editor, volume or number, series, pages, address, month, organization, publisher, note.
    else if (data.entryType == "inproceedings") {
        authors = ((authors) ? authors : "Authors are required!");
        var title = ((data.title) ? data.title : "<strong style='color:red;'>Title is required!</strong>");
        var booktitle = ((data.booktitle) ? data.booktitle : "<strong style='color:red;'>Book title is required!</strong>");
        var year = ((data.year) ? data.year : "<strong style='color:red;'>Year is required!</strong>");
        if (formatValue == 'mla') {
            return authors +
                ". \"" + title + ".\" " + 
                "<em>" + booktitle + "<\/em>. " + 
                ((data.publisher) ? data.publisher + ", " : "")
                year + 
                ".";
        }
        else if (formatValue == 'apa') {
            return authors + 
                " (" + year + "). " + 
                title + 
                ". In <em>" + booktitle + "<\/em>" + 
                ((data.pages) ? " (pp. " + data.pages + ")" : "") + 
                "." +
                ((data.publisher) ? " " + data.publisher + "." : "");
        }
        else if (formatValue == 'chicago') {
            return authors + 
                ". \"" + title + ".\" " + 
                ". In <em>" + booktitle + "<\/em>" +
                ((data.pages) ? " (pp. " + data.pages + ")" : "") + 
                "." +
                ((data.publisher) ? " " + data.publisher + ", ": "") +
                year + ".";
        }
        else if (formatValue == 'amslike') {
            return authors + 
                ". \"" + title + ".\" " + 
                ". In <em>" + booktitle + "<\/em>" +
                ((data.pages) ? " (pp. " + data.pages + ")" : "") + 
                "." +
                ((data.publisher) ? " " + data.publisher + ", ": "") +
                year + ".";
        }
        else if (formatValue == 'harvard') {
            return authors + 
                " " + year + 
                ". " + title + 
                ". In <em>" + data.booktitle + "<\/em>" +
                ((data.pages) ? " (pp. " + data.pages + ")" : "") + 
                "." +
                ((data.publisher) ? " " + data.publisher + ".": "");
        }
        else if (formatValue == 'vancouver') {
            return authors + 
                title + 
                ". In " + booktitle + " " +
                data.year + " " + 
                ((data.pages) ? " (pp. " + data.pages + ")" : "") + 
                "." +
                ((data.publisher) ? " " + data.publisher + ".": "");
        }
    }
    // BOOK
    // A book with an explicit publisher.
    // Required fields: author or editor, title, publisher, year.
    // Optional fields: volume or number, series, address, edition, month, note.
    else if (data.entryType == "book") {
        authors = ((authors) ? authors : "Authors are required!");
        var title = ((data.title) ? data.title : "<strong style='color:red;'>Title is required!</strong>");
        var publisher = ((data.publisher) ? data.publisher : "<strong style='color:red;'>Publisher is required!</strong>");
        var year = ((data.year) ? data.year : "<strong style='color:red;'>Year is required!</strong>");
        if (authors == "Authors are required!") { 
            authors = ((data.editor) ? data.editor : "<strong style='color:red;'>Author or Editor is required!</strong>");
        }
        if (formatValue == 'mla') {
            return authors + 
                ". <em>" + title + "<\/em>." + 
                ((data.volume) ? " Vol. " + data.volume : "") +  
                ". " + 
                publisher + ", " + 
                year + ".";
        }
        else if (formatValue == 'apa') {
            return authors + 
                " (" + year + "). <em>" + 
                title + "<\/em>." +
                ((data.volume) ? " (Vol. " + data.volume + ") " : " ") +  
                publisher + ".";
        }
        else if (formatValue == 'chicago') {
            return authors + 
                ". <em>" + title + "<\/em>." +
                ((data.volume) ? " Vol. " + data.volume + ". ": "") + 
                publisher + ", " + 
                year + ".";
        }
        else if (formatValue == 'amslike') {
            return authors + 
                ". <em>" + title + "<\/em>." +
                ((data.volume) ? " Vol. " + data.volume + ". ": "") + 
                publisher + ", " + 
                year + ".";
        }
        else if (formatValue == 'harvard') {
            return authors + " " +
                year + ". " + 
                ". <em>" + title + "<\/em>." + 
                ((data.volume) ? " (Vol. " + data.volume + "). " : " ") +
                publisher + ".";
        }
        else if (formatValue == 'vancouver') {
            return authors + ". " + 
                title + ". " + 
                publisher + "; " + 
                year + ".";
        }
    }
    // PHD THESIS
    // A Ph.D. thesis.
    // Required fields: author, title, school, year.
    // Optional fields: type, address, month, note.
    else if (data.entryType == 'phdthesis') {
        authors = ((authors) ? authors : "Authors are required!");
        var title = ((data.title) ? data.title : "<strong style='color:red;'>Title is required!</strong>");
        var school = ((data.school) ? data.school : "<strong style='color:red;'>School is required!</strong>");
        var year = ((data.year) ? data.year : "<strong style='color:red;'>Year is required!</strong>");
        if (formatValue == 'mla') {
            return authors + 
                ". <em>" + title + "<\/em>" +
                ". Diss." + school + 
                ", " + year + ".";
        }
        else if (formatValue == 'apa') {
            return authors + 
                " (" + year + "). " + 
                "<em>" + title + "<\/em>." +
                " (Doctoral dissertation, " + school + ").";
        }
        else if (formatValue == 'chicago') {
            return authors + 
                ". \"" + title + ".\" " + 
                "PhD diss., " + school + ", " + 
                year + ". ";
        }
        else if (formatValue == 'amslike') {
            return authors + 
                ". \"" + title + ".\" " + 
                "PhD diss., " + school + ", " + 
                year + ". ";
        }
        else if (formatValue == 'harvard') {
            return authors + 
                ", " + year + 
                ". <em>" + title + "<\/em>." + 
                " (Doctoral dissertation, " + school + ").";
        }
        else if (formatValue == 'vancouver') {
            return authors + 
                ". <em>" + title + "<\/em>" + 
                " (Doctoral dissertation, " + school + ").";
        }
    }

    // UNPUBLISHED
    // Required fields: author, title.
    // Optional fields: note.


    else if (data.entryType == 'unpublished') {
        authors = ((authors) ? authors : "Authors are required!");
        var title = ((data.title) ? data.title : "<strong style='color:red;'>Title is required!</strong>");
        return authors +
            ", <em>" + title + "<\/em>," + 
            ((data.year) ? " " + data.year + "," : "") + 
            ((data.note) ? " " + data.note : "") +
            ".";
    }

    // MISC
    // Use this type when nothing else fits. A warning will be issued if all optional fields are empty 
    // (i.e., the entire entry is empty or has only ignored fields).
    // Required fields: none.
    // Optional fields: author, title, howpublished, month, year, note.
    else if (data.entryType == 'misc') {
        if (formatValue == 'mla' || formatValue == 'chicago' || formatValue == 'amslike' ) {
            return ((authors) ? authors + ". ": "") + 
                ((data.title) ? "\"" + data.title + ".\" ": "") +  
                ((data.howpublished) ? howpublished2readable(data.howpublished) + ". ": "") +
                ((data.year) ? " (" + data.year + "). ": "");
        }
        else if (formatValue == 'apa'|| formatValue == 'harvard') {
            return ((authors) ? authors + ". ": "") + 
                ((data.year) ? " (" + data.year + "). ": "") +
                ((data.title) ? data.title + ". ": "") +  
                ((data.howpublished) ? howpublished2readable(data.howpublished) + ". ": "");
        }
        else if (formatValue == 'vancouver') {
            return ((authors) ? authors + ". ": "") + 
                ((data.title) ? data.title + ". ": "") +  
                ((data.howpublished) ? howpublished2readable(data.howpublished) + ". ": "");
        }
    }
    // Otherwise
    else {
        return 'Format ' + data.entryType + ' not supported yet!'
    }
}

async function getThesis() {
    var contents = await fetch('bib/thesis.bib').then(response => response.text());

    // If empty, return nothing!
    if (contents == '') {
        console.log('Contents are empty!');
        return;
    }

    // BIBTEX PARSER
    var bibtex = new BibTex();
    bibtex.content = contents;
    bibtex.parse();

    var citation = bibtex.data[0];

    // Format citation
    // Citation style: amslike
    var output = format(citation);
    
    thesis.innerHTML = htmlify(output).substring(82,);
}



// Function called to convert BibTeX to other format
async function main() {
    
    var contents = await fetch('bib/bibliography.bib').then(response => response.text());

    // Reset output
    // toInput.value = '';
    papers.innerHTML = '';

    // Contents to format
    

    // If empty, return nothing!
    if (contents == '') {
        console.log('Contents are empty!');
        return;
    }

    // BIBTEX PARSER
    var bibtex = new BibTex();
    bibtex.content = contents;
    bibtex.parse();


    // For each parsed citation
    for (var i in bibtex.data) {

        // Get citation
        var citation = bibtex.data[i];

        // Format citation
        // Citation style: amslike
        var output = format(citation);
        // console.log('output: ' + output);
        // console.log('htmlify:' + htmlify(output));
        // Show

        var t = "<li><p style=\"display: inline\">"+ htmlify(output) + "<pre style=\"display: inline\">";
        if ( citation.hasOwnProperty("arxiv") ) {
            t += " <a href=\""+citation["arxiv"] +"\">arXiv</a>";
        }

        if ( citation["entryType"] !== "unpublished" ) {
            t += " <a download=\""+ citation["cite"] +".bib\" href=\"data:application/octet-stream;charset=utf-8,"+ encodeURIComponent(citation["originalContent"]) + " \">bib</a>";
        }
        t += "</pre></p></li>";

        papers.innerHTML += t;

    }
 
    MathJax.typeset();
//    console.log(papers.innerHTML)
}

main();
getThesis();