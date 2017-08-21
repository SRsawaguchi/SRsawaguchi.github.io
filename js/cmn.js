(function ($){

  $(function(){
    //スムーススクロール
    (function(speed,offset){
      $('a[href^=#]').on('click',function() {
        var offset = -$('header').height();
        var href= $(this).attr('href');
        var target = $(href == '#' || href == '' ? 'html' : href);
        var position = target.offset().top + offset;
        $('body,html').animate({scrollTop:position}, speed, 'swing');
        return false;
      });
    })(400);

    //ドロップダウン
    (function($tgl,activeClass){
      $tgl.on('click',function(e){
        $tgl.toggleClass(activeClass);
        $tgl.next().toggleClass(activeClass);
        e.preventDefault();
      });
    })($('.dd-toggle'),'js-active');

  });

})(jQuery)
