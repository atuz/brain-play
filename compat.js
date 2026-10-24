// Loaded before modules. Native implementations are never replaced.
(function () {
  'use strict';
  function define(target, name, value) {
    if (target && !target[name]) Object.defineProperty(target, name, { value: value, configurable: true, writable: true });
  }
  function lengthOf(value) { return Math.min(Math.max(Math.floor(Number(value) || 0), 0), 9007199254740991); }
  define(Object, 'hasOwn', function (object, key) { return Object.prototype.hasOwnProperty.call(object, key); });
  define(Array.prototype, 'at', function (index) {
    if (this == null) throw new TypeError('Invalid receiver');
    var object = Object(this), length = lengthOf(object.length), n = +index || 0;
    n = n < 0 ? Math.ceil(n) : Math.floor(n);
    var position = n >= 0 ? n : length + n;
    return position < 0 || position >= length ? undefined : object[position];
  });
  define(Array.prototype, 'findLastIndex', function (predicate, context) {
    if (this == null || typeof predicate !== 'function') throw new TypeError('Invalid receiver or predicate');
    var object = Object(this);
    for (var i = lengthOf(object.length) - 1; i >= 0; i--) if (predicate.call(context, object[i], i, object)) return i;
    return -1;
  });
  define(String.prototype, 'replaceAll', function (search, replacement) {
    if (this == null) throw new TypeError('Invalid receiver');
    var regex = search != null && (search[Symbol.match] !== undefined
      ? Boolean(search[Symbol.match]) : Object.prototype.toString.call(search) === '[object RegExp]');
    if (regex && String(search.flags).indexOf('g') < 0) throw new TypeError('A global RegExp is required');
    if (search != null && typeof search[Symbol.replace] === 'function') return search[Symbol.replace](String(this), replacement);
    var escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return String(this).replace(new RegExp(escaped, 'g'), replacement);
  });
  if (typeof Element !== 'undefined') {
    define(Element.prototype, 'replaceChildren', function () {
      var fragment = this.ownerDocument.createDocumentFragment();
      fragment.append.apply(fragment, arguments);
      while (this.firstChild) this.removeChild(this.firstChild);
      this.appendChild(fragment);
    });
  }
  if (typeof CanvasRenderingContext2D !== 'undefined') {
    define(CanvasRenderingContext2D.prototype, 'roundRect', function (x, y, width, height, radii) {
      var values = Array.isArray(radii) ? radii : [radii === undefined ? 0 : radii];
      if (!values.length || values.length > 4) throw new RangeError('Expected one to four radii');
      var corners = values.map(function (value) {
        var radius = typeof value === 'object' && value !== null ? { x: Number(value.x === undefined ? 0 : value.x), y: Number(value.y === undefined ? 0 : value.y) }
          : { x: Number(value), y: Number(value) };
        if (radius.x < 0 || radius.y < 0) throw new RangeError('Negative radius');
        return radius;
      });
      if (![x, y, width, height].every(Number.isFinite) || !corners.every(function (r) { return Number.isFinite(r.x) && Number.isFinite(r.y); })) return;
      if (corners.length === 1) corners = [corners[0], corners[0], corners[0], corners[0]];
      else if (corners.length === 2) corners = [corners[0], corners[1], corners[0], corners[1]];
      else if (corners.length === 3) corners = [corners[0], corners[1], corners[2], corners[1]];
      if (width < 0) { x += width; width = -width; corners = [corners[1], corners[0], corners[3], corners[2]]; }
      if (height < 0) { y += height; height = -height; corners = [corners[3], corners[2], corners[1], corners[0]]; }
      var tl = corners[0], tr = corners[1], br = corners[2], bl = corners[3];
      // A zero-radius edge imposes no scale constraint.
      var scale = Math.min(1, (tl.x + tr.x) ? width / (tl.x + tr.x) : 1,
        (bl.x + br.x) ? width / (bl.x + br.x) : 1, (tl.y + bl.y) ? height / (tl.y + bl.y) : 1,
        (tr.y + br.y) ? height / (tr.y + br.y) : 1);
      corners = corners.map(function (r) { return { x: r.x * scale, y: r.y * scale }; });
      tl = corners[0]; tr = corners[1]; br = corners[2]; bl = corners[3];
      var c = this;
      function arc(cx, cy, r, from, to) {
        if (r.x && r.y) c.ellipse(cx, cy, r.x, r.y, 0, from, to);
        else c.lineTo(cx + r.x * Math.cos(to), cy + r.y * Math.sin(to));
      }
      c.moveTo(x + tl.x, y); c.lineTo(x + width - tr.x, y);
      arc(x + width - tr.x, y + tr.y, tr, -Math.PI / 2, 0);
      c.lineTo(x + width, y + height - br.y); arc(x + width - br.x, y + height - br.y, br, 0, Math.PI / 2);
      c.lineTo(x + bl.x, y + height); arc(x + bl.x, y + height - bl.y, bl, Math.PI / 2, Math.PI);
      c.lineTo(x, y + tl.y); arc(x + tl.x, y + tl.y, tl, Math.PI, Math.PI * 1.5);
      c.closePath(); c.moveTo(x, y);
    });
  }
  if (typeof document !== 'undefined' && document.body) {
    if (typeof CSS !== 'undefined' && !CSS.supports('aspect-ratio', '1')) document.documentElement.classList.add('legacy-aspect');
    var flex = document.createElement('div');
    flex.style.cssText = 'position:absolute;visibility:hidden;display:flex;flex-direction:column;row-gap:1px';
    flex.append(document.createElement('div'), document.createElement('div'));
    document.body.appendChild(flex);
    if (flex.scrollHeight !== 1) document.documentElement.classList.add('legacy-flex-gap');
    flex.remove();
  }
}());
