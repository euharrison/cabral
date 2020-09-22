;var InfoJewel = (function() {

  var selector = '#info-jewel';
  var dom = $(selector);

  var isOpen = false;

  setup();

  function setup() {
    dom.on('click', close);
  }

  function feed(item) {
    var money = 'R$ ' + numberWithDots(item.value) + ',00';

    var lastParenteshis = item.description.lastIndexOf('(');
    var description = item.description;
    description = description.substr(0, lastParenteshis) + '<br>' + description.substr(lastParenteshis);

    dom.find('.image img').attr('src', 'assets/jewel/'+slug(item.name)+'.svg');
    dom.find('.name').html(item.name);
    dom.find('.value').html(money);
    dom.find('.description').html(description);
    dom.find('.extra').html(item.date + ' ' + item.extra);

    open();
  }

  function open() {
    if (isOpen) {
      return;
    }

    isOpen = true;

    dom.css({ visibility: 'visible' });
    anime({
      targets: selector,
      opacity: 1,
      easing: 'linear',
      duration: 500,
    });
  }

  function close() {
    if (!isOpen) {
      return;
    }

    isOpen = false;

    anime({
      targets: selector,
      opacity: 0,
      easing: 'linear',
      duration: 500,
      complete: function() {
        dom.find('.image img').attr('src', '');
        dom.css({ visibility: 'hidden' });
      }
    });
  }

  function numberWithDots(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  return {
    feed: feed,
  }

})();
