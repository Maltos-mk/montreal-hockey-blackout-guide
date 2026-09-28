const fs = require('fs');

let js = fs.readFileSync('teams/montreal/i18n.js', 'utf8');
js = js.replace('walkDOM: function(el, callback) {', `
  translateNode: function(el) {
    this.walkDOM(el, (node) => {
      const text = node.nodeValue.trim();
      if (text) {
        if (!this.originalNodes.has(node)) {
          this.originalNodes.set(node, text);
        }
        const origText = this.originalNodes.get(node);
        const trans = this.t(origText);
        if (trans !== origText || this.current === 'en') {
          node.nodeValue = node.nodeValue.replace(origText, trans);
        }
      }
    });
  },
  
  walkDOM: function(el, callback) {`);

fs.writeFileSync('teams/montreal/i18n.js', js);
