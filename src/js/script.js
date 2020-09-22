;(function() {

  // DB

  DB.forEach(function(item) {
    var dateArray = item.date.split('/');
    item.day = Number(dateArray[0]);
    item.month = Number(dateArray[1]);
    item.year = Number(dateArray[2]);
  });

  DB.sort(function(a, b) {
    return a.year - b.year || a.month - b.month || a.day - b.day;
  });

  var valueSum = 0;
  DB.forEach(function(item) {
    valueSum += item.value;
    item.valueSum = valueSum;
  });


  // UI

  var infoVisible = false;

  $('#nav button').click(function() {
    var button = $(this);
    if (infoVisible) {
      infoVisible = false;
      anime({
        targets: '#info',
        opacity: 0,
        easing: 'linear',
        duration: 600,
        complete: function() {
          $('#info').css({ visibility: 'hidden' });
        }
      });
      button.text('Info');
    } else {
      infoVisible = true;
      $('#info').css({ visibility: 'visible' });
      anime({
        targets: '#info',
        opacity: 1,
        easing: 'linear',
        duration: 600,
      });
      button.text('Fechar');
    }
  })

  $('#intro').click(function() {
    UI.setup();
    anime({
      targets: '#intro',
      opacity: 0,
      easing: 'linear',
      duration: 1200,
      complete: function() {
        $('#intro').remove();
      }
    });
    anime({
      targets: '#tutorial',
      opacity: 0,
      easing: 'linear',
      delay: 5000,
      duration: 1200,
      complete: function() {
        $('#tutorial').remove();
      }
    });
  })

  if (ENV_DEV) {
    UI.setup();
    $('#intro').remove();
    $('#tutorial').remove();
  }

})();
