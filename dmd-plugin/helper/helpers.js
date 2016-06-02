var ddata = require('ddata');

exports.linkifyOrInlineLinks = linkifyOrInlineLinks;

/**
replaces {@link} tags with markdown links in the suppied input text.
if no links are found, then link to entire 
*/
function linkifyOrInlineLinks (text, options) {
  if (text) {
    var links = ddata.parseLink(text);
    if (links.length > 0) {
      links.forEach(function (link) {
        var linked = ddata._link(link.url, options)
        if (link.caption === link.url) link.caption = linked.name
        if (linked.url) link.url = linked.url
        text = text.replace(link.original, '[' + link.caption + '](' + link.url + ')')
      })
    } else {
      var linked = ddata._link(text, options)
      text = '[' + linked.name + '](' + linked.url + ')';
    }
  }
  return text
}
