$(document).ready(function () {
    // <karnaugh_map function_name="NOR" variables="A,B" truth_table="1,0,0,0" />
    $('karnaugh_map').each(function (n,div) {
        var function_name = $(div).attr('function_name');
        var variables = $(div).attr('variables').split(',');
        var truth_table = $(div).attr('truth_table').split(',');

        var nrows,ncols;
        if (variables.length == 1) { nrows = 1; ncols = 2; }
        else if (variables.length == 2) { nrows = 2; ncols = 2; }
        else if (variables.length == 3) { nrows = 2; ncols = 4; }
        else { nrows = 4; ncols = 4; }

        var kmap = $('<table border="1" cellpadding="2" bgcolor="#E0E0E0" style="border-collapse:collapse;"></table>');
        var vars = (ncols == 2) ? variables[0] : variables[0]+variables[1];
        var labels = (ncols == 2) ? ['0','1'] : ['00','01','11','10'];

        var row = $('<tr><td rowspan="2" colspan="2" align="center" valign="center"><b><nobr>'+function_name+'</nobr></b></td></tr>');
        row.append($('<td align="center"></td>').attr('colspan',ncols).text(vars));
        kmap.append(row);

        row = $('<tr></tr>');
        $.each(labels,function(index,l) {
            row.append($('<td align="center"></td>').text(l));
        });
        kmap.append(row);

        var index = ncols >> 1;
        vars = (nrows == 2) ? variables[index] : variables[index]+variables[index+1];
        labels = (nrows == 2) ? ['0','1'] : ['00','01','11','10'];

        index = 0;
        $.each(labels,function (i,l) {
            row = $('<tr></tr>');
            if (index == 0) {
                row.append($('<td align="center"></td>').attr('rowspan',nrows).text(vars));
            }
            row.append($('<td align="center"></td>').text(l));
            for (i = 0; i < ncols; i += 1) {
                row.append($('<td bgcolor="white" width="25" align="center"><font size="4"><b>'+truth_table[index]+'</b></font></td>'));
                index += 1;
            }
            kmap.append(row);
        });

        $(div).replaceWith(kmap);
    });
});
