'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/* global Vivus */

var markerTemplate = function markerTemplate(data) {
   return '\n   <div class="pin" id="' + (data.id || '') + '" style="left: ' + data.left + '; top: ' + data.top + ';">\n      <div class="glow"></div>\n      <div class="circle"></div>\n      <div class="more">\n         <div class="content" data-earmark="' + data.earmark + '">\n            ' + data.content + '\n         </div>\n      </div>\n   </div>\n';
};

var noop = function noop() {};
var report = function report() {
   var category = arguments.length <= 0 || arguments[0] === undefined ? 'unknown' : arguments[0];
   var action = arguments.length <= 1 || arguments[1] === undefined ? 'unknown' : arguments[1];
   var label = arguments[2];
   var value = arguments[3];

   (window.ga || noop)('send', 'event', category, action, label, value);
};

var App = function () {
   function App() {
      _classCallCheck(this, App);

      this.$ = window.jQuery;
      this.marker = window.config.marker;
      this.items = [];
      this.amount = 0;
      this.bonusName = window.config.bonusName;

      this.$marker = this.$('.marker');
      this.$result = this.$('.result');
      this.$amount = this.$('.result .amount');
      this.$resultMore = this.$('.result .more');
      this.$items = this.$('.result .items');
      this.$infoBlock = this.$('.info-block');
      this.$infoButtons = this.$('.info-buttons');
      this.$donateButton = this.$('.donation-button');
      this.$earmark = this.$('.donation-earmark');
      this.$form = this.$('.donation-form');

      this.bindEvents();
      this.changeInfobox(0);
      this.startIntro();
   }

   _createClass(App, [{
      key: 'bindEvents',
      value: function bindEvents() {
         var _this = this;

         this.$marker.on('click', '.item', this.handleAddition.bind(this));
         this.$items.on('click', '.item', this.handleRemoval.bind(this));
         this.$amount.on('keyup change', this.handleAmountChange.bind(this));
         this.$form.on('submit', this.beforeSubmit.bind(this));

         this.$infoButtons.on('click', '[data-view]', function (event) {
            event.preventDefault();
            _this.changeInfobox(event.currentTarget.dataset.view);
            report('Infobox', 'changed', 'Seite "' + event.currentTarget.innerText + '"');
         });

         if ('ontouchstart' in window) {
            $('body').addClass('touch-device');
            this.applyTouchDeviceLogic();
         } else {
            $('body').addClass('mouse-device');
         }
      }
   }, {
      key: 'applyTouchDeviceLogic',
      value: function applyTouchDeviceLogic() {
         var _this2 = this;

         var removeActive = function removeActive() {
            return _this2.$marker.find('.pin.active').removeClass('active');
         };

         $(window).on('touchstart', removeActive);

         this.$marker.on('touchstart', '.pin', function (event) {
            event.stopPropagation();
            var $target = _this2.$(event.target);
            var $currentTarget = _this2.$(event.currentTarget);

            if (!$currentTarget.hasClass('active')) {
               removeActive();
            }

            if ($target.hasClass('circle') || $target.hasClass('glow')) {
               $currentTarget.toggleClass('active');
            }
         });

         // Wird anscheiend nicht mehr geladen, darum manuell
         var $nav = this.$('.navbar-main-collapse');
         this.$('.navbar-toggle').on('click', function () {
            return $nav.slideToggle();
         });
      }
   }, {
      key: 'startIntro',
      value: function startIntro() {
         var _this3 = this;

         var id = 'svg-lkw';
         var onReady = function onReady() {
            _this3.$('#' + id).css('opacity', 1);
         };
         var callback = function callback() {
            var htmlItems = _this3.marker.map(markerTemplate);
            _this3.$marker.html(htmlItems.join(''));
            var firstPin = _this3.$('.pin .more').first();
            _this3.animate(firstPin, 'glimpse');
            _this3.adjustMarkerContentPositions();
         };

         if (window.innerWidth < 768 || /^((?!chrome).)*safari/i.test(window.navigator.userAgent)) {
            onReady();
            callback();
         } else {
            this.runSVGAnimation(id, function () {
               // on Ready
               report('Animation', 'started');
               onReady();
            }, function () {
               // on Finish
               report('Animation', 'ended');
               callback();
            });
         }
      }
   }, {
      key: 'render',
      value: function render() {
         this.$amount.val(this.amount);
         this.renderItems();
      }
   }, {
      key: 'beforeSubmit',
      value: function beforeSubmit() {
         report('Donation', 'submitted', 'amount', this.amount);
         var counts = {};
         this.items.forEach(function (item) {
            counts[item.earmark] = (counts[item.earmark] || 0) + item.price;
         });
         var earmark = Object.keys(counts).sort(function (a, b) {
            return counts[b] - counts[a];
         })[0];
         this.$earmark.val(earmark || '');
      }
   }, {
      key: 'changeInfobox',
      value: function changeInfobox(view) {
         this.$infoBlock.attr('data-view', view).find('.view').hide().eq(view).show();
      }
   }, {
      key: 'handleAmountChange',
      value: function handleAmountChange() {
         this.amount = +this.$amount.val();
         report('Donation', 'changed', 'amount', this.amount);
         this.renderItems();
      }
   }, {
      key: 'handleAddition',
      value: function handleAddition(_ref) {
         var _ref$currentTarget = _ref.currentTarget;
         var currentTarget = _ref$currentTarget === undefined ? {} : _ref$currentTarget;

         var name = currentTarget.innerText;
         var price = +currentTarget.dataset.price;
         var earmark = currentTarget.parentElement.dataset.earmark;
         report('Donation', 'added', name, price);
         this.addProduct({ name: name, price: price, earmark: earmark });
      }
   }, {
      key: 'handleRemoval',
      value: function handleRemoval(_ref2) {
         var _ref2$currentTarget = _ref2.currentTarget;
         var currentTarget = _ref2$currentTarget === undefined ? {} : _ref2$currentTarget;

         var name = currentTarget.innerText;
         var price = +currentTarget.dataset.price;
         report('Donation', 'removed', name, price);
         this.removeProduct({ name: name, price: price });
      }
   }, {
      key: 'addProduct',
      value: function addProduct(item) {
         this.amount += item.price;
         this.items = [].concat(_toConsumableArray(this.items), [item]).sort(function (a, b) {
            return a.price - b.price;
         });
         this.render();
         this.animate(this.$result, 'grow');
      }
   }, {
      key: 'removeProduct',
      value: function removeProduct(_ref3) {
         var name = _ref3.name;
         var price = _ref3.price;

         this.amount -= price;
         var index = this.items.map(function (item) {
            return item.name;
         }).indexOf(name);
         this.items.splice(index, 1);
         this.render();
      }
   }, {
      key: 'renderItems',
      value: function renderItems() {
         var _this4 = this;

         var items = [].concat(_toConsumableArray(this.items));
         var hasItems = !(this.amount > 0 || items.length);
         var actualValue = this.$amount.val();
         var itemTemplate = function itemTemplate(item) {
            return '<div class="item" data-price="' + item.price + '">\n                                         <span class="name">' + item.name + '</span>\n                                      </div>';
         };
         var targetValue = this.calculateAmount();

         this.$resultMore.toggleClass('hidden', hasItems);
         this.$donateButton.attr('disabled', hasItems);

         if (items.length && actualValue < targetValue) {
            var _ret = function () {
               var partlyOff = function partlyOff(item) {
                  return '<div class="item"><span class="name">' + item.name + '</span>\n                                       <div class="price">' + item.newPrice + '&nbsp;\u20AC\n                                          <span class="strike">' + item.price + '&nbsp;\u20AC</span>\n                                       </div>\n                                    </div>';
               };
               var fullyOff = function fullyOff(item) {
                  return '<div class="item strike">\n                                        <span class="name">' + item.name + '</span>\n                                        <span data-price="' + item.price + '"></span>\n                                     </div>';
               };

               var html = items.map(function (item) {
                  var difference = targetValue - actualValue;

                  if (!difference) {
                     return itemTemplate(item); // normal
                  }

                  if (difference < item.price) {
                     // partly off
                     targetValue -= difference;
                     item.newPrice = item.price - difference;
                     return partlyOff(item);
                  }

                  targetValue -= item.price;
                  return fullyOff(item); // fully off
               }).join('');
               _this4.$items.html(html);
               return {
                  v: void 0
               };
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
         }

         if (actualValue > targetValue) {
            items.push({
               name: this.bonusName,
               price: actualValue - targetValue
            });
         }

         var itemsHtml = items.map(itemTemplate).join('');
         var html = items.length ? itemsHtml : '';
         this.$items.html(html);
      }
   }, {
      key: 'calculateAmount',
      value: function calculateAmount() {
         return this.items.map(function (item) {
            return item.price;
         }).reduce(function (sum, price) {
            return sum + price;
         }, 0);
      }
   }, {
      key: 'animate',
      value: function animate($element, className) {
         var callback = arguments.length <= 2 || arguments[2] === undefined ? this.$.noop : arguments[2];

         $element.addClass(className);
         $element.one('animationend', function () {
            $element.removeClass(className);
            callback();
         });
      }
   }, {
      key: 'runSVGAnimation',
      value: function runSVGAnimation() {
         var id = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
         var onReady = arguments.length <= 1 || arguments[1] === undefined ? this.$.noop : arguments[1];
         var callback = arguments.length <= 2 || arguments[2] === undefined ? this.$.noop : arguments[2];

         var settings = window.config.vivusSettings;
         settings.onReady = onReady;
         this.vivus = new Vivus(id, settings, callback);
      }
   }, {
      key: 'adjustMarkerContentPositions',
      value: function adjustMarkerContentPositions() {
         this.$marker.find('.pin .content').each(function (index, element) {
            element.parentElement.style.display = 'block';
            var bounds = element.getBoundingClientRect();
            element.parentElement.style.display = '';
            if (bounds.left < 0) {
               element.style.left = Math.abs(bounds.left) + 'px';
            } else if (window.innerWidth - bounds.right < 0) {
               element.style.right = bounds.right - window.innerWidth + 'px';
            }
         });
      }
   }]);

   return App;
}();

$(function () {
   return window.app = new App();
}); // eslint-disable-line no-return-assign
//# sourceMappingURL=script.js.map