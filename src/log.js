const url = require('url');

function replaceLog(str, f) {
  let text = f ? '' : '\n\n', obj_hover = {}, ye;
  str.replace(/\u{FEFF}/gu, '').split('\n').forEach(item => {
    if (item.includes(f ? ': information: compiling' : ': information: checking')) {
      let regEx = new RegExp(`(?<=${f ? 'compiling' : 'checking'}.).+'`, 'gi'),
        name = String(item.match(regEx)),
        link = url.pathToFileURL(String(item.match(/[a-z]:\\.+(?= :)/gi))).href;
      Object.assign(obj_hover, { [name]: { ['link']: link } });
      text += name + '\n';
    }
    else if (item.includes(': information: including')) {
      let name_icl = String(item.match(/(?<=information: including ).+'/gi)),
        link_icl = url.pathToFileURL(String(item.match(/[a-z]:\\.+(?= :)/gi))).href;
      Object.assign(obj_hover, { [name_icl]: { ['link']: link_icl } });
      text += name_icl + '\n';
    }
    else if (item.includes('information: generating code') || item.includes('information: code generated')) return;
    else if (item.includes('information: info')) {
      let name_info = String(item.match(/(?<=information: ).+/gi)),
        link_info = url.pathToFileURL(String(item.match(/[a-z]:\\.+(?= :)/gi))).href;
      Object.assign(obj_hover, { [name_info]: { ['link']: link_info } });
      text += name_info + '\n';
    }
    else if (item.includes(f ? 'Result:' : ': information: result')) {
      let Err = item.match(/(?!0)\d+.error/), War = item.match(/(?!0)\d+.warning/);

      if (Err != null) {
        text += f ? '[Error] ' + item : '[Error] Result: ' + item.match(/\d+.error.+/);
        ye = true;
      } else if (War != null) {
        text += f ? '[Warning] ' + item : '[Warning] Result: ' + item.match(/\d+.error.+/);
        ye = false;
      } else {
        text += f ? '[Done] ' + item : '[Done] Result: ' + item.match(/\d+.error.+/);
        ye = false;
      }
    }
    else {
      let re = /([a-zA-Z]:\\.+(?= :)|^\(\d+,\d+\))(?:.: )(.+)/,
        link_res = item.replace(re, '$1').replace(/[\r\n]+/g, ''),
        name_res = item.replace(re, '$2').replace(/[\r\n]+/g, ''),
        gh = name_res.match(/(?<=error |warning )\d+/);

      name_res = name_res.replace(gh, '');

      if (link_res.match(/[a-z]:\\.+/gi) && name_res != '') {
        Object.assign(obj_hover, { [name_res + ' ' + String(link_res.match(/\((?:\d+\,\d+)\)$/gm))]: { ['link']: String(url.pathToFileURL(link_res).href.replace(/\((?=(\d+,\d+).$)/gm, '#').replace(/\)$/gm, '')), ['number']: String(gh) } });
        text += name_res + ' ' + link_res.match(/(.)(?:\d+,\d+).$/gm) + '\n';
      }
      else {
        if (gh) {
          Object.assign(obj_hover, { [name_res]: { ['link']: '', ['number']: gh } });
          text += name_res + '\n';
        }
        else
          text += name_res + '\n';
      }
    }
  });

  return text;
}


module.exports = {
  replaceLog
};
