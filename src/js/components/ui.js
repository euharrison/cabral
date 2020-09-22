var UI = (function() {

  var horizontal = $('#horizontal');
  var background = horizontal.find('.background');
  var yearsContainer = horizontal.find('.years');
  var bulletsContainer = horizontal.find('.bullets');
  var horizontalInfo = horizontal.find('.info');
  var horizontalName = horizontal.find('.info .name');
  var horizontalValue = horizontal.find('.info .value');
  var horizontalDate = horizontal.find('.info .date');
  var horizontalExtra = horizontal.find('.info .extra');
  var bullets;

  var vertical = $('#vertical');
  var verticalText = vertical.find('.text');
  var verticalCounter = vertical.find('.counter');
  var verticalValue = vertical.find('.value');

  var overlays = $('#overlays');

  var controls = $('#controls');

  var windowWidth = 0;
  var maxScrollY = 0;

  var position = 0;
  var lastPosition = DB.length - 1;

  var positionAnimation;

  function setup() {
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();

    var year = 0;
    DB.forEach(function(item, index) {
      if (year != item.year) {
        year = item.year;
        var firstDay = {
          day: 1,
          month: 1,
          year: year,
        }
        yearsContainer.append($('<span class="year" style="transform: translateX('+Math.round(itemTranslate(firstDay))+'px)">'+year+'</span>'));
      }
    });

    var jewelIndex = 0;
    DB.forEach(function(item, index) {
      var bulletBig = item.description ? 'big' : '';
      var bullet = $('<button index="'+index+'" class="'+bulletBig+'" style="transform: translateX('+Math.round(itemTranslate(item))+'px)"></button>');
      bulletsContainer.append(bullet);

      if (bulletBig) {
        var bulletJewel = $('<span class="jewel"><img src="assets/icon-jewel.svg"></span>');
        bullet.append(bulletJewel);
        bullet.attr('jewel-index', jewelIndex);
        bulletJewel.on('click', onClickBulletJewel);

        var jewel = $('<div class="jewel"><button index="'+index+'"><img src="assets/icon-jewel.svg"></button></div>');
        overlays.append(jewel);

        jewel.find('button').on('click', onClickJewel);
        jewelIndex++;
      }
    });

    bullets = bulletsContainer.find('button');
    bullets.on('click', onClickBullet);

    $('body').css({ height: DB.length * 400 });

    $(window).keydown(onKeyDown);

    controls.find('.rewind').click(onClickRewind);
    controls.find('.play').click(onClickPlay);

    $(window).on('resize', onResize);
    onResize();

    $(window).on('scroll mousewheel', onScroll);

    setPosition(0);
  }

  function onResize() {
    windowWidth = $(window).width();
    maxScrollY = $('body').height() - $(window).height();
    setPosition(position);
  }

  function onScroll(e) {
    e.preventDefault();
    var delta = 0;
    var deltaX = e.originalEvent.deltaX;
    var deltaY = e.originalEvent.deltaY;
    if (deltaY || deltaX) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        delta = deltaY;
      } else {
        delta = deltaX;
      }
    }
    var percent = (window.scrollY + delta) / maxScrollY;
    var newPosition = percent * lastPosition;
    setPosition(newPosition);
  }

  function onKeyDown(e) {
    switch (e.keyCode) {
      case 37: //left
      case 38: //up
        animePosition(Math.round(position - 1));
        e.preventDefault();
        break;

      case 39: //right
      case 40: //down
        animePosition(Math.round(position + 1));
        e.preventDefault();
        break;
    }
  }

  function onClickBullet(e) {
    var index = $(e.currentTarget).attr('index');
    animePosition(index, 1000);
  }

  function onClickRewind() {
    animePosition(0, 1500, 'easeInOutCubic');
  }

  function onClickPlay() {
    animePosition(lastPosition, Math.abs(lastPosition - position) * 300, 'easeInOutSine');
  }

  function onClickJewel(e) {
    var index = $(e.currentTarget).attr('index');
    openJewel(index);
  }

  function onClickBulletJewel(e) {
    var index = $(e.currentTarget).parent().attr('index');
    openJewel(index);
  }

  function openJewel(index) {
    var jewelIndex = bullets.filter('[index="'+index+'"]').attr('jewel-index');

    animePosition(index);
    Picture.explodeSpot(jewelIndex);

    var delay = Math.abs(position - index) > 0.2 ? 600 : 0;
    setTimeout(function() {
      InfoJewel.feed(DB[index]);
    }, delay);
  }

  function setPosition(newPosition) {
    position = Number(newPosition);

    if (position < 0) {
      position = 0;
    }
    if (position > lastPosition) {
      position = lastPosition;
    }

    var index = Math.round(position);
    var item = DB[index];

    var horizontalMargin = 100;

    // horizontal
    var prevIndex = Math.floor(position);
    var nextIndex = Math.ceil(position);
    var prevTranslate = itemTranslate(DB[prevIndex]);
    var nextTranslate = itemTranslate(DB[nextIndex]);
    var translate = prevTranslate === nextTranslate ? prevTranslate : map(position, prevIndex, nextIndex, prevTranslate, nextTranslate);
    var backgroundWidth = horizontalMargin + translate;
    background.css({ transform: 'translateX('+Math.round(backgroundWidth)+'px)' });

    horizontalInfo.css({ left: Math.round(backgroundWidth)+'px' });
    if (position > lastPosition / 2) {
      horizontalInfo.addClass('after-middle');
    } else {
      horizontalInfo.removeClass('after-middle');
    }

    var lastItem = DB[lastPosition];
    var lastTranslate = itemTranslate(lastItem);
    var percent = translate / lastTranslate;
    var maxHorizontalLeft = windowWidth - (lastTranslate + 2*horizontalMargin);
    var horizontalLeft = percent * maxHorizontalLeft;
    horizontal.css({ left: Math.round(horizontalLeft)+'px' });

    bullets.removeClass('active');
    var activeBullet = bullets.eq(Math.round(position));
    activeBullet.addClass('active');

    var money = 'R$ ' + numberWithDots(item.value) + ',00';
    horizontalName.html(item.name);
    horizontalValue.text(money);
    horizontalDate.text(item.date);
    horizontalExtra.text(item.extra);

    // vertical
    var verticalPercent = mapPosition(0, 100);
    verticalText.css({ bottom: verticalPercent+'%' });

    var counter = (index) + ' joia' + (index > 1 ? 's' : '');
    var moneySum = 'R$ ' + numberWithDots(item.valueSum) + ',00';
    verticalCounter.text(counter);
    verticalValue.text(moneySum);

    // overlays
    var jewelIndex = activeBullet.attr('jewel-index');
    overlays.find('button').removeClass('active');
    if (jewelIndex) {
      var jewelButton = overlays.find('[index="'+index+'"]');
      jewelButton.addClass('active');
    }

    // picture
    Picture.setValue(item.valueSum);

    // scroll
    var scrollTop = mapPosition(0, maxScrollY);
    $(window).scrollTop(scrollTop);
  }

  function animePosition(newPosition, duration, easing) {
    if (positionAnimation) {
      positionAnimation.pause();
    }

    duration = duration || 300;
    easing = easing || 'easeOutCubic';

    var positionObject = { value: position };
    positionAnimation = anime({
      targets: positionObject,
      value: Math.round(newPosition),
      duration: duration,
      easing: easing,
      update: function() {
        setPosition(positionObject.value);
      },
    }); 
  }

  function numberWithDots(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function map(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
  }

  function mapPosition(out_min, out_max) {
    return map(position, 0, lastPosition, out_min, out_max);
  }

  function itemTranslate(item) {
    return ( (item.day-1) + (item.month-1)*30 + (item.year-2007)*365 ) * 0.8;
  }

  return {
    setup: setup,
  }

})();
