(function() {
  function loadScriptOnce(src, onLoad, onError) {
    var script = document.createElement('script');
    script.src = src;
    script.onload = onLoad;
    script.onerror = onError;
    document.head.appendChild(script);
  }

  /**
   * Lazy-loads jsPDF, AutoTable, and the site logo (if not already present),
   * extracts visible schedule rows, and downloads a formatted letter-size PDF.
   */
  window.runSchedulePdfExport = function(opts) {
    var btn = document.getElementById(opts.buttonId || 'btnExportPDF');
    var originalText = btn ? btn.innerHTML : '';
    var restoreButton = function() {
      if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    };

    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span class="hidden sm:inline">' + (opts.generatingText || 'Generating...') + '</span>';
      btn.disabled = true;
    }

    var buildAndSave = function() {
      try {
        var jsPDF = window.jspdf && window.jspdf.jsPDF;
        if (!jsPDF) {
          restoreButton();
          return;
        }
        var doc = new jsPDF('p', 'pt', 'letter');
        var pageWidth = doc.internal.pageSize.getWidth();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(opts.title || '2026-27 NHL TV Schedule', 40, 50);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(59, 130, 246);
        var cleanUrl = window.location.origin + window.location.pathname.replace('index.html', '');
        doc.text(cleanUrl, 40, 68);

        if (window.PDF_LOGO_B64) {
          doc.addImage(window.PDF_LOGO_B64, 'JPEG', pageWidth - 45 - 40, 35, 45, 45);
        }

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(2);
        doc.line(40, 85, pageWidth - 40, 85);

        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        var contextLines = doc.splitTextToSize(opts.contextStr || '', pageWidth - 80);
        doc.text(contextLines, 40, 105);
        var dynamicStartY = 105 + (contextLines.length * 14);

        var body = [];
        var tbody = document.getElementById('scheduleTableBody');
        var sourceRows = tbody ? tbody.querySelectorAll('tr') : [];
        sourceRows.forEach(function(row) {
          if (row.style.display === 'none' || row.classList.contains('hidden')) return;
          var cells = row.querySelectorAll('td');
          if (cells.length >= 6) {
            body.push([
              cells[1].innerText.replace(/\n/g, ' '),
              cells[2].innerText.replace(/\n/g, ' '),
              cells[3].innerText.replace(/\n/g, ' '),
              cells[5].innerText.replace(/\n/g, ' - ')
            ]);
          }
        });

        var statusTerms = opts.statusTerms || {
          watchable: ['Watchable'],
          blackedOut: ['Blacked Out'],
          outOfMarket: ['Out-of-Market', 'Need Sub']
        };

        doc.autoTable({
          startY: dynamicStartY,
          head: [opts.head || ['Date & Time', 'Matchup', 'Network', 'Access Status']],
          body: body,
          theme: 'striped',
          headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', lineWidth: 0.5, lineColor: [203, 213, 225] },
          bodyStyles: { textColor: [15, 23, 42] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { top: 40, right: 40, bottom: 40, left: 40 },
          didParseCell: function(data) {
            if (data.section === 'body' && data.column.index === 3) {
              var raw = String(data.cell.raw || '');
              if (statusTerms.watchable.some(function(t) { return raw.indexOf(t) !== -1; })) {
                data.cell.styles.textColor = [5, 150, 105];
              } else if (statusTerms.blackedOut.some(function(t) { return raw.indexOf(t) !== -1; })) {
                data.cell.styles.textColor = [220, 38, 38];
              } else if (statusTerms.outOfMarket.some(function(t) { return raw.indexOf(t) !== -1; })) {
                data.cell.styles.textColor = [217, 119, 6];
              }
            }
          }
        });

        doc.save(opts.fileName || 'Schedule.pdf');
      } finally {
        restoreButton();
      }
    };

    var ensureLogoAndBuild = function() {
      if (typeof window.PDF_LOGO_B64 === 'undefined') {
        loadScriptOnce(opts.logoSrc || '/shared/pdf-logo.js', buildAndSave, buildAndSave);
      } else {
        buildAndSave();
      }
    };

    if (typeof window.jspdf === 'undefined') {
      loadScriptOnce(
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        function() {
          loadScriptOnce(
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
            ensureLogoAndBuild,
            restoreButton
          );
        },
        restoreButton
      );
    } else {
      ensureLogoAndBuild();
    }
  };
})();
