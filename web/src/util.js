export function randomRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const jsonHtml = {
  replacer: function (match, pIndent, pKey, pVal, pEnd) {
    var key = "<span class=json-key>";
    var val = "<span class=json-value>";
    var str = "<span class=json-string>";
    var r = pIndent || "";
    if (pKey) r = r + key + pKey.replace(/[": ]/g, "") + "</span>: ";
    if (pVal) r = r + (pVal[0] == '"' ? str : val) + pVal + "</span>";
    return r + (pEnd || "");
  },
  prettyPrint: function (obj) {
    var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/gm;
    return JSON.stringify(obj, null, 2)
      .replace(/&/g, "&amp;")
      .replace(/\\"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(jsonLine, jsonHtml.replacer);
  },
};

export function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}
