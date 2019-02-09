export default class Text {
  static byte(str) {
    return encodeURIComponent(str).replace(/%../g, 'x').length;
  }
}
