/* global Vivus */

const markerTemplate = (data) => `
   <div class="pin" id="${data.id || ''}" style="left: ${data.left}; top: ${data.top};">
      <div class="glow"></div>
      <div class="circle"></div>
      <div class="more">
         <div class="content" data-earmark="${data.earmark}">
            ${data.content}
         </div>
      </div>
   </div>
`;

const noop = () => {};
const report = (category = 'unknown', action = 'unknown', value) => {
   console.info(category, action, value);
   (window.ga || noop)('send', 'event', category, action, 'Campaign', value);
};

class App {

   constructor() {
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

   bindEvents() {
      this.$marker.on('click', '.item', this.handleAddition.bind(this));
      this.$items.on('click', '.item', this.handleRemoval.bind(this));
      this.$amount.on('keyup change', this.handleAmountChange.bind(this));
      this.$form.on('submit', this.beforeSubmit.bind(this));

      this.$infoButtons.on('click', '[data-view]', (event) => {
         event.preventDefault();
         this.changeInfobox(event.currentTarget.dataset.view);
         report('Infobox', 'changed', event.currentTarget.innerText);
      });

      if ('ontouchstart' in window) {
         $('body').addClass('touch-device');
         this.applyTouchDeviceLogic();
      }
      else {
         $('body').addClass('mouse-device');
      }
   }

   applyTouchDeviceLogic() {
      const removeActive = () => this.$marker.find('.pin.active').removeClass('active');

      $(window).on('touchstart', removeActive);

      this.$marker.on('touchstart', '.pin', (event) => {
         event.stopPropagation();
         const $target = this.$(event.target);
         const $currentTarget = this.$(event.currentTarget);

         if (!$currentTarget.hasClass('active')) {
            removeActive();
         }

         if ($target.hasClass('circle') || $target.hasClass('glow')) {
            $currentTarget.toggleClass('active');
         }
      });

      // Wird anscheiend nicht mehr geladen, darum manuell
      const $nav = this.$('.navbar-main-collapse');
      this.$('.navbar-toggle').on('click', () => $nav.slideToggle());
   }

   startIntro() {
      const id = 'svg-lkw';
      const onReady = () => { this.$(`#${id}`).css('opacity', 1); };
      const callback = () => {
         const htmlItems = this.marker.map(markerTemplate);
         this.$marker.html(htmlItems.join(''));
         const firstPin = this.$('.pin .more').first();
         this.animate(firstPin, 'glimpse');
         this.adjustMarkerContentPositions();
      };

      if (window.innerWidth < 768 || /^((?!chrome).)*safari/i.test(window.navigator.userAgent)) {
         onReady();
         callback();
      }
      else {
         this.runSVGAnimation(id,
            () => { // on Ready
               report('Animation', 'started');
               onReady();
            },
            () => { // on Finish
               report('Animation', 'ended');
               callback();
            }
         );
      }
   }

   render() {
      this.$amount.val(this.amount);
      this.renderItems();
   }

   beforeSubmit() {
      report('Donation', 'submitted', this.amount);
      const counts = {};
      this.items.forEach((item) => {
         counts[item.earmark] = (counts[item.earmark] || 0) + item.price;
      });
      const earmark = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      this.$earmark.val(earmark || '');
   }

   changeInfobox(view) {
      this.$infoBlock
         .attr('data-view', view)
         .find('.view')
         .hide()
         .eq(view)
         .show();
   }

   handleAmountChange() {
      this.amount = +this.$amount.val();
      report('Donation', 'changed', this.amount);
      this.renderItems();
   }

   handleAddition({ currentTarget = {} }) {
      const name = currentTarget.innerText;
      const price = +currentTarget.dataset.price;
      const earmark = currentTarget.parentElement.dataset.earmark;
      report('Donation', 'added', `${name}: ${price}`);
      this.addProduct({ name, price, earmark });
   }

   handleRemoval({ currentTarget = {} }) {
      const name = currentTarget.innerText;
      const price = +currentTarget.dataset.price;
      report('Donation', 'removed', `${name}: ${price}`);
      this.removeProduct({ name, price });
   }

   addProduct(item) {
      this.amount += item.price;
      this.items = [...this.items, item].sort((a, b) => a.price - b.price);
      this.render();
      this.animate(this.$result, 'grow');
   }

   removeProduct({ name, price }) {
      this.amount -= price;
      const index = this.items.map(item => item.name).indexOf(name);
      this.items.splice(index, 1);
      this.render();
   }

   renderItems() {
      const items = [...this.items];
      const hasItems = !(this.amount > 0 || items.length);
      const actualValue = this.$amount.val();
      const itemTemplate = (item) => `<div class="item" data-price="${item.price}">
                                         <span class="name">${item.name}</span>
                                      </div>`;
      let targetValue = this.calculateAmount();

      this.$resultMore.toggleClass('hidden', hasItems);
      this.$donateButton.attr('disabled', hasItems);

      if (items.length && actualValue < targetValue) {
         const partlyOff = (item) => `<div class="item"><span class="name">${item.name}</span>
                                       <div class="price">${item.newPrice}&nbsp;€
                                          <span class="strike">${item.price}&nbsp;€</span>
                                       </div>
                                    </div>`;
         const fullyOff = (item) => `<div class="item strike">
                                        <span class="name">${item.name}</span>
                                        <span data-price="${item.price}"></span>
                                     </div>`;

         const html = items.map((item) => {
            const difference = targetValue - actualValue;

            if (!difference) {
               return itemTemplate(item); // normal
            }

            if (difference < item.price) { // partly off
               targetValue -= difference;
               item.newPrice = item.price - difference;
               return partlyOff(item);
            }

            targetValue -= item.price;
            return fullyOff(item); // fully off
         }).join('');
         this.$items.html(html);
         return;
      }

      if (actualValue > targetValue) {
         items.push({
            name: this.bonusName,
            price: actualValue - targetValue,
         });
      }

      const itemsHtml = items.map(itemTemplate).join('');
      const html = items.length ? itemsHtml : '';
      this.$items.html(html);
   }

   calculateAmount() {
      return this.items
         .map(item => item.price)
         .reduce((sum, price) => sum + price, 0);
   }

   animate($element, className, callback = this.$.noop) {
      $element.addClass(className);
      $element.one('animationend', () => {
         $element.removeClass(className);
         callback();
      });
   }

   runSVGAnimation(id = '', onReady = this.$.noop, callback = this.$.noop) {
      const settings = window.config.vivusSettings;
      settings.onReady = onReady;
      this.vivus = new Vivus(id, settings, callback);
   }

   adjustMarkerContentPositions() {
      this.$marker.find('.pin .content').each((index, element) => {
         element.parentElement.style.display = 'block';
         const bounds = element.getBoundingClientRect();
         element.parentElement.style.display = '';
         if (bounds.left < 0) {
            element.style.left = `${Math.abs(bounds.left)}px`;
         }
         else if (window.innerWidth - bounds.right < 0) {
            element.style.right = `${bounds.right - window.innerWidth}px`;
         }
      });
   }

}

$(() => window.app = new App()); // eslint-disable-line no-return-assign
