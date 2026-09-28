let code = "<span>${g.vs}</span>";
code = code.replace(/\$\{g.vs\}/g, "${t(g.vs)}");
console.log(code);
