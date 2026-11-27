/* Chuyển động được vẽ theo vị trí trên tranh, độc lập với các nút điểm sáng. */
'use strict';
window.StoryCinema = (() => {
  const WIDTH = 1000, HEIGHT = 2000 / 3, TWO_PI = Math.PI * 2;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches || document.body.classList.contains('calm');
  const wave = phase => (Math.sin(phase) + 1) / 2;
  const noise = n => {
    const value = Math.sin(n * 127.1 + 7.4) * 43758.5453;
    return value - Math.floor(value);
  };
  const forestPools = [[804,397,61,28], [915,382,48,25], [735,440,42,22]];
  const coastPools = [[71,351,53,41], [150,399,47,33], [908,570,75,44], [969,474,29,27]];
  const palacePools = [[514,322,56,22], [870,427,51,24], [856,489,52,23], [714,614,36,26]];
  const falls = [[940,254,15,37], [930,292,24,39], [906,333,35,42], [779,522,27,35]];
  const forestSwarm = swarm([[70,231,67,48,14], [878,329,100,88,24], [552,273,65,60,10]]);
  const palaceStars = swarm([[771,43,172,39,21]]);

  function swarm(regions) {
    return regions.flatMap(([x,y,w,h,count], region) => Array.from({ length:count }, (_, index) => {
      const id = region * 47 + index * 5;
      return { x:x + w * (noise(id) - .5) * 2, y:y + h * (noise(id + 1) - .5) * 2,
        phase:noise(id + 2) * TWO_PI, drift:5 + noise(id + 3) * 11, size:1 + noise(id + 4) * 1.75 };
    }));
  }

  function glimmers(ctx, time, points, tint, fly) {
    ctx.fillStyle = tint;
    for (const { x, y, phase, drift, size } of points) {
      const glow = wave(time * 2.2 + phase) ** 3;
      const dx = fly ? Math.sin(time * .6 + phase) * drift : 0;
      const dy = fly ? Math.cos(time * .81 + phase) * drift * .7 : 0;
      ctx.globalAlpha = glow * .28;
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, size * 2.9, 0, TWO_PI);
      ctx.fill();
      ctx.globalAlpha = glow * .86;
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, size, 0, TWO_PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function water(ctx, time, pools, tint, openSea = false) {
    ctx.strokeStyle = tint;
    ctx.lineCap = 'round';
    for (const [x, y, w, h] of pools) {
      for (let i = 0; i < 9; i++) {
        const progress = (time * (.29 + noise(i + 12) * .24) + i / 9) % 1;
        const shift = noise(i + 38) - .5;
        const cx = x + w * shift * 1.55 + Math.sin(i + time) * (openSea ? 7 : 3);
        const cy = y + h * (noise(i + 54) - .5) + progress * (openSea ? 9 : 4);
        const radius = 4 + progress * w * .24;
        ctx.globalAlpha = Math.sin(Math.PI * progress) * (openSea ? .68 : .58);
        ctx.lineWidth = 1.15 + (openSea ? 1.4 : .6) * progress;
        ctx.beginPath();
        ctx.moveTo(cx - radius, cy);
        ctx.quadraticCurveTo(cx - 1, cy - 2 - progress * 2, cx + radius, cy - 1);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function lighthouse(ctx, time) {
    ctx.save();
    ctx.translate(188, 161);
    ctx.rotate(-.08 + Math.sin(time * .72) * .24);
    const light = ctx.createLinearGradient(0, 0, 188, 0);
    light.addColorStop(0, '#fffac4c0');
    light.addColorStop(.32, '#ffe28766');
    light.addColorStop(1, '#ffe28700');
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(188, -24);
    ctx.lineTo(188, 24);
    ctx.lineTo(0, 4);
    ctx.fill();
    ctx.restore();
  }

  function fallingWater(ctx, time) {
    ctx.strokeStyle = '#cefaff';
    for (const [x, y, w, h] of falls) {
      for (let i = 0; i < 10; i++) {
        const phase = (time * (.6 + noise(i + 15) * .54) + i / 10) % 1;
        const xx = x + (noise(i + 84) * 2 - 1) * w * .46 - phase * 7;
        const yy = y + phase * h;
        ctx.globalAlpha = .5 * Math.sin(Math.PI * phase);
        ctx.lineWidth = 1.1 + noise(i + 33) * 1.7;
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.quadraticCurveTo(xx - 1, yy + 4, xx - 2, Math.min(yy + 12, y + h));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function coastBirds(ctx, time) {
    const x = (time * 26) % 290 + 236;
    ctx.strokeStyle = '#fff8e6';
    ctx.lineWidth = 1.65;
    for (let i = 0; i < 3; i++) {
      const xx = x - i * 16, yy = 104 - i * 6 + Math.sin(time * .8 + i) * 6;
      const flap = Math.sin(time * 8 + i * 2.4) * 3.5;
      ctx.globalAlpha = Math.min(1, (x - 236) / 35, (526 - x) / 35) * .83;
      ctx.beginPath();
      ctx.moveTo(xx - 7, yy - flap);
      ctx.quadraticCurveTo(xx - 3, yy - flap - 1, xx, yy);
      ctx.quadraticCurveTo(xx + 3, yy - flap - 1, xx + 7, yy - flap);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  const art = {
    rabbit(ctx, time) {
      water(ctx, time, forestPools, '#a0efff');
      glimmers(ctx, time, forestSwarm, '#fff2a2', true);
    },
    football(ctx, time) {
      water(ctx, time, coastPools, '#c9fffa', true);
      lighthouse(ctx, time);
      coastBirds(ctx, time);
    },
    royal(ctx, time) {
      fallingWater(ctx, time);
      water(ctx, time, palacePools, '#ffdd8c');
      glimmers(ctx, time, palaceStars, '#fff0c9', false);
    }
  };

  function mount(stage, route) {
    const canvas = stage.querySelector('.forest-ambient');
    const ctx = canvas?.getContext('2d');
    const draw = art[route];
    if (!ctx || !draw) return;
    let last = 0, visible = true;
    const start = performance.now();
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(stage);
    // Chỉ đo lại khi khung đổi cỡ. Giới hạn độ phân giải và tần số trên màn hình mật độ cao.
    const size = new ResizeObserver(([entry]) => {
      const scale = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(entry.contentRect.width * scale));
      canvas.height = Math.max(1, Math.round(canvas.width * HEIGHT / WIDTH));
    });
    size.observe(stage);

    function tick(now) {
      if (!stage.isConnected) {
        observer.disconnect();
        size.disconnect();
        return;
      }
      requestAnimationFrame(tick);
      if (!visible || document.hidden || document.body.classList.contains('modal-open') || reduced() || now - last < 30) return;
      ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      draw(ctx, (now - start) / 1000);
      last = now;
    }
    requestAnimationFrame(tick);
  }

  function approach(stage, point) {
    const camera = stage.querySelector('.forest-map-camera');
    if (reduced() || !camera?.animate) return null;
    camera.getAnimations().filter(animation => animation.id === 'story-map-approach').forEach(animation => animation.cancel());
    camera.style.transformOrigin = point.map(percent => percent + '%').join(' ');
    const flight = camera.animate([
      { transform:'scale(1)' },
      { transform:'scale(1.27)' }
    ], { duration:480, easing:'cubic-bezier(.2,.72,.26,1)', fill:'forwards' });
    flight.id = 'story-map-approach';
    return flight;
  }

  return { mount, approach };
})();
