;var Picture = (function() {

  if ( ! Detector.webgl ) {
    Detector.addGetWebGLMessage();
  }

  var distortionValue = 0;
  var explodedSpots = [];

  var picturePixels = [];
  var totalParticles;

  var mouseX = 0, mouseY = 0;
  var windowHalfX = window.innerWidth / 2;
  var windowHalfY = window.innerHeight / 2;

  var renderer, scene, camera;
  var particleSystem, uniforms, geometry;
  var stats;

  var img = document.getElementById('picture-image');
  var canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
  var context = canvas.getContext('2d');

  var jewelsOverlay = $('#overlays');

  if (img.width) {
    boot();
  } else {
    img.addEventListener('load', boot);
  }

  function boot() {
    init();
    animate();
  }

  function init() {
    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 650;
    camera.rotation.z = Math.PI;

    scene = new THREE.Scene();

    var columns = 500;
    var rows = 500;
    totalParticles = columns * rows;

    // cache pixels for optimizations
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
    var imageData = context.getImageData(0, 0, img.width, img.height).data;
    function getColor(x, y) {
      var red = Math.floor(y) * (img.width * 4) + Math.floor(x) * 4;
      var indices = [red, red + 1, red + 2, red + 3]
      return [
        imageData[indices[0]],
        imageData[indices[1]],
        imageData[indices[2]],
      ]
    }

    for ( var i = 0, i3 = 0; i < totalParticles; i++, i3 += 3 ) {
      var x = (i % columns)/columns * img.width;
      var y = Math.floor(i / columns)/rows * img.height;
      var pixelData = getColor(x, y);

      if (pixelData[ 0 ] < 20 && pixelData[ 1 ] < 20 && pixelData[ 2 ] < 20) {
        continue;
      }

      var pixel = {};
      
      pixel.x = x - img.width/2 + Math.random();
      pixel.y = y - img.height/2 + Math.random();
      pixel.z = Math.random() * 200;

      pixel.xSpecial = 0;
      if (Math.random() < 0.15) {
        pixel.xSpecial = pixel.x * 2;
      }

      pixel.r = pixelData[ 0 ];
      pixel.g = pixelData[ 1 ];
      pixel.b = pixelData[ 2 ];
      
      picturePixels.push(pixel);
    }

    totalParticles = picturePixels.length;

    var positions = new Float32Array( totalParticles * 3 * 3 );
    var colors = new Float32Array( totalParticles * 3 * 3 );
    var shineTime = new Float32Array( totalParticles * 3 );

    for ( var i = 0, i3 = 0, i9 = 0; i < totalParticles; i++, i3 += 3, i9 += 9 ) {
      positions[ i9 + 0 ] = picturePixels[ i ].x;
      positions[ i9 + 1 ] = picturePixels[ i ].y;
      positions[ i9 + 2 ] = 0;

      positions[ i9 + 3 ] = picturePixels[ i ].x;
      positions[ i9 + 4 ] = picturePixels[ i ].y;
      positions[ i9 + 5 ] = 0;

      positions[ i9 + 6 ] = picturePixels[ i ].x;
      positions[ i9 + 7 ] = picturePixels[ i ].y;
      positions[ i9 + 8 ] = 0;

      colors[ i9 + 0 ] = picturePixels[ i ].r / 255;
      colors[ i9 + 1 ] = 0;
      colors[ i9 + 2 ] = 0;

      colors[ i9 + 3 ] = 0;
      colors[ i9 + 4 ] = picturePixels[ i ].g / 255;
      colors[ i9 + 5 ] = 0;

      colors[ i9 + 6 ] = 0;
      colors[ i9 + 7 ] = 0;
      colors[ i9 + 8 ] = picturePixels[ i ].b / 255;

      var randTime = Math.random();
      shineTime[ i3 + 0 ] = randTime;
      shineTime[ i3 + 1 ] = randTime;
      shineTime[ i3 + 2 ] = randTime;
    }

    geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
    geometry.addAttribute( 'shineTime', new THREE.BufferAttribute( shineTime, 1 ) );

    uniforms = {
      u_time:       { value: 1.0 },
      u_resolution: { value: new THREE.Vector2() },
    };

    var shaderMaterial = new THREE.ShaderMaterial( {
      uniforms:       uniforms,
      vertexShader:   document.getElementById( 'vertexshader' ).textContent,
      fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
      blending:       THREE.AdditiveBlending,
      depthTest:      false,
      transparent:    true
    });

    particleSystem = new THREE.Points( geometry, shaderMaterial );
    scene.add( particleSystem );

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.sortObjects = false;

    var container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    stats = new Stats();
    if (ENV_DEV) {
      container.appendChild( stats.dom );
    }

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    document.addEventListener( 'touchmove', onDocumentTouchMove, false );

    onWindowResize();
  }

  function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

    uniforms.u_resolution.value.x = renderer.domElement.width;
    uniforms.u_resolution.value.y = renderer.domElement.height;
  }

  function animate() {
    requestAnimationFrame( animate );
    render();
    stats.update();
  }

  function render() {
    var time = Date.now() * 0.005;

    if (windowHalfY > windowHalfX) {
      particleSystem.position.y = -50;
      particleSystem.position.z = -300;
    } else {
      particleSystem.position.z = 0;
      particleSystem.position.z = 0;
    }

    particleSystem.rotation.x = -mouseY / windowHalfY / 4;
    particleSystem.rotation.y = -mouseX / windowHalfX / 4 + Math.PI;

    jewelsOverlay.css('transform', 'rotateX('+particleSystem.rotation.x+'rad) rotateY('+ -particleSystem.rotation.y+'rad)');

    var positions = geometry.attributes.position.array;

    var maxDistortionValue = 6562270;
    var multiplier = (distortionValue+1) / maxDistortionValue;

    for ( var i = 0, i3 = 0; i < totalParticles; i++, i3 += 9 ) {
      var x = picturePixels[ i ].x * (1 + multiplier) + picturePixels[ i ].xSpecial * multiplier;
      var y = picturePixels[ i ].y * (1 + multiplier);
      var z = picturePixels[ i ].z * multiplier*0.5;

      positions[ i3 + 0 ] = x;
      positions[ i3 + 1 ] = y;
      positions[ i3 + 2 ] = z;

      positions[ i3 + 3 ] = x;
      positions[ i3 + 4 ] = y;
      positions[ i3 + 5 ] = z;

      positions[ i3 + 6 ] = x;
      positions[ i3 + 7 ] = y;
      positions[ i3 + 8 ] = z;
    }

    for (var j = 0; j < explodedSpots.length; j++) {
      var index = explodedSpots[j];

      if (index < 3) {
        effectBreakVertical(positions, multiplier);
      }

      if (index > 2 && index < 5) {
        effectBreakHorizontal(positions, multiplier);
      }

      if (index > 4) {
        effectRGB(positions, multiplier);
      }

      if (index == 7) {
        effectHalfScreenVertical(positions, multiplier);
      }

      if (index == 8) {
        effectHalfScreenHorizontal(positions, multiplier);
      }

      if (index == 9) {
        effectBuum(positions, multiplier);
      }
    }

    geometry.attributes.position.needsUpdate = true;

    renderer.render( scene, camera );

    uniforms.u_time.value += 0.05;
  }

  function effectBreakVertical(positions, multiplier) {
    for ( var i = 0, i3 = 0; i < totalParticles; i++, i3 += 9 ) {
      positions[ i3 + 1 ] += Math.round(positions[ i3 + 0 ] / 100) * 10 * multiplier;
      positions[ i3 + 4 ] += Math.round(positions[ i3 + 3 ] / 100) * 10 * multiplier;
      positions[ i3 + 7 ] += Math.round(positions[ i3 + 6 ] / 100) * 10 * multiplier;
    }
  }

  function effectBreakHorizontal(positions, multiplier) {
    for ( var i = 0, i3 = 0; i < totalParticles; i++, i3 += 9 ) {
      positions[ i3 + 0 ] += Math.round(positions[ i3 + 1 ] / 100) * 10 * multiplier;
      positions[ i3 + 3 ] += Math.round(positions[ i3 + 4 ] / 100) * 10 * multiplier;
      positions[ i3 + 6 ] += Math.round(positions[ i3 + 7 ] / 100) * 10 * multiplier;
    }
  }

  function effectRGB(positions, multiplier) {
    for ( var i = 0, i3 = 0; i < totalParticles; i++, i3 += 9 ) {
      positions[ i3 + 0 ] -= 1 * multiplier;
      positions[ i3 + 6 ] += 1 * multiplier;
    }
  }

  function effectHalfScreenVertical(positions, multiplier) {
    for ( var i = 0, i3 = 0; i < totalParticles; i++, i3 += 9 ) {
      positions[ i3 + 0 ] += 10000 / (positions[ i3 + 0 ] * positions[ i3 + 0 ]) * multiplier;
      positions[ i3 + 3 ] += 10000 / (positions[ i3 + 3 ] * positions[ i3 + 3 ]) * multiplier;
      positions[ i3 + 6 ] += 10000 / (positions[ i3 + 6 ] * positions[ i3 + 6 ]) * multiplier;
    }
  }

  function effectHalfScreenHorizontal(positions, multiplier) {
    for ( var i = 0, i3 = 0; i < totalParticles; i++, i3 += 9 ) {
      positions[ i3 + 1 ] += 100 / (positions[ i3 + 1 ] - 30) * multiplier;
      positions[ i3 + 4 ] += 100 / (positions[ i3 + 4 ] - 30) * multiplier;
      positions[ i3 + 7 ] += 100 / (positions[ i3 + 7 ] - 30) * multiplier;
    }
  }

  function effectBuum(positions, multiplier) {
    for ( var i = 0, i3 = 0; i < totalParticles; i++, i3 += 9 ) {
      positions[ i3 + 2 ] *= (2/multiplier) * multiplier*1.5;
      positions[ i3 + 5 ] *= (2/multiplier) * multiplier*1.5;
      positions[ i3 + 8 ] *= (2/multiplier) * multiplier*1.5;
    }
  }

  function onDocumentMouseMove( event ) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
  }

  function onDocumentTouchStart( event ) {
    if ( event.touches.length === 1 ) {
      event.preventDefault();
      mouseX = event.touches[ 0 ].clientX - windowHalfX;
      mouseY = event.touches[ 0 ].clientY - windowHalfY;
    }
  }

  function onDocumentTouchMove( event ) {
    if ( event.touches.length === 1 ) {
      event.preventDefault();
      mouseX = event.touches[ 0 ].clientX - windowHalfX;
      mouseY = event.touches[ 0 ].clientY - windowHalfY;
    }
  }

  function setValue(value) {
    distortionValue = value;
  }

  function explodeSpot(index) {
    explodedSpots.push(Number(index));
  }

  return {
    setValue: setValue,
    explodeSpot: explodeSpot,
  }

})();
