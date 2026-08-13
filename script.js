/* ===================================================================
   EL PARTIDO DEL CUMPLEAÑOS — script.js
   JS vanilla, sin librerías. Cada módulo revisa que sus nodos existan
   antes de operar, así ningún bloque rompe a los demás.
   =================================================================== */

/* ============================= */
/* CONFIGURACIÓN CENTRALIZADA    */
/* ============================= */
const CONFIG = {
  nombre: "Nicolás Orozco",
  edad: 8,
  fecha: "2026-08-29T15:00:00-05:00", // 3:00 PM hora Colombia
  lugar: "Cancha Sintética Brasileirao",
  direccion: "Cra. 46 #76-109, Barranquilla, Atlántico",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cancha%20Sint%C3%A9tica%20Brasileirao%2C%20Cra.%2046%20%2376-109%2C%20Barranquilla",
  posicion: "Delantero · Capitán del equipo",
  introHabilitada: true
};

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esDesktopFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ============================= */
  /* HIDRATACIÓN DE DATOS          */
  /* ============================= */
  (function hidratar(){
    document.querySelectorAll('[data-cfg]').forEach(el => {
      const clave = el.getAttribute('data-cfg');
      if(clave === 'nombreCorto'){
        el.textContent = CONFIG.nombre.split(' ')[0];
      } else if(clave === 'fechaLarga'){
        const f = new Date(CONFIG.fecha);
        let texto = new Intl.DateTimeFormat('es-CO', { day:'numeric', month:'long', year:'numeric' }).format(f);
        el.textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
      } else if(CONFIG[clave] !== undefined){
        el.textContent = CONFIG[clave];
      }
    });

    const mapsBtn = document.getElementById('mapsBtn');
    if(mapsBtn) mapsBtn.href = CONFIG.mapsUrl;

    document.title = `¡Estás Invitado! · El Partido del Cumpleaños de ${CONFIG.nombre.split(' ')[0]} ⚽`;
  })();

  /* ============================= */
  /* CONFETI (pool reciclable)     */
  /* ============================= */
  const confeti = (function crearConfeti(){
    const pool = document.getElementById('confetiPool');
    if(!pool) return { lanzar(){} };

    const colores = ['#ffd23f', '#16b34a', '#2f6bff', '#ff2d55', '#f6f5ee'];
    const TOTAL = 24;
    const piezas = [];

    for(let i = 0; i < TOTAL; i++){
      const p = document.createElement('span');
      p.className = 'confeti-pieza' + (i % 3 === 0 ? ' confeti-pieza--redonda' : '');
      pool.appendChild(p);
      piezas.push(p);
    }

    function lanzar(cantidad){
      if(prefersReducedMotion) return;
      const n = Math.min(cantidad, piezas.length);
      for(let i = 0; i < n; i++){
        const p = piezas[i];
        const izquierda = Math.random() * 100;
        const deriva = (Math.random() * 140 - 70).toFixed(0) + 'px';
        const rotacion = (620 + Math.random() * 400).toFixed(0) + 'deg';
        const color = colores[Math.floor(Math.random() * colores.length)];
        const demora = (Math.random() * 0.35).toFixed(2) + 's';

        p.style.left = izquierda + '%';
        p.style.background = color;
        p.style.setProperty('--dx', deriva);
        p.style.setProperty('--rot', rotacion);
        p.style.animationDelay = demora;

        // Reinicia la animación aunque la pieza ya estuviera activa
        p.classList.remove('activa');
        void p.offsetWidth;
        p.classList.add('activa');
      }
    }

    pool.addEventListener('animationend', (e) => {
      e.target.classList.remove('activa');
    });

    return { lanzar };
  })();

  /* ============================= */
  /* INTRO DE ENTRADA              */
  /* ============================= */
  (function intro(){
    const wrap = document.getElementById('introWrap');
    if(!wrap) return;

    const yaVista = sessionStorage.getItem('introVista') === '1';

    if(!CONFIG.introHabilitada || yaVista || prefersReducedMotion){
      wrap.remove();
      confeti.lanzar(16);
      return;
    }

    const wrapVideo = document.getElementById('introVideoWrap');
    const video = document.getElementById('introVideo');
    const skipBtn = document.getElementById('introSkip');
    let terminada = false;

    function saltar(){
      if(terminada) return;
      terminada = true;
      sessionStorage.setItem('introVista', '1');
      wrap.classList.add('saliendo');
      setTimeout(() => { wrap.remove(); confeti.lanzar(16); }, 260);
    }

    skipBtn.addEventListener('click', saltar);
    document.addEventListener('keydown', function escSalir(e){
      if(e.key === 'Escape'){ saltar(); document.removeEventListener('keydown', escSalir); }
    });

    video.play().catch(() => {}); // respaldo silencioso si el navegador bloquea el autoplay

    if(typeof gsap !== 'undefined'){
      gsap.to(wrapVideo, { opacity: 1, duration: .6, ease: 'power1.out' });
    } else {
      wrapVideo.style.opacity = 1; // por si el CDN de GSAP no llegó a cargar
    }

    // Cuando Snoopy termina de patear y el balón sale de escena, el propio
    // video termina; tras una breve pausa se cierra la intro.
    video.addEventListener('ended', () => setTimeout(saltar, 300));
  })();

  /* ============================= */
  /* REVEALS AL HACER SCROLL       */
  /* ============================= */
  (function reveals(){
    const elementos = document.querySelectorAll('[data-reveal]');
    if(!elementos.length) return;

    if(prefersReducedMotion || !('IntersectionObserver' in window)){
      elementos.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if(entrada.isIntersecting){
          entrada.target.classList.add('visible');
          observer.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    elementos.forEach(el => observer.observe(el));
  })();

  /* ============================= */
  /* CONFETI POR SECCIÓN            */
  /* ============================= */
  (function confetiPorSeccion(){
    const objetivos = ['convocatoria', 'footer']
      .map(id => document.getElementById(id))
      .filter(Boolean);
    if(!objetivos.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if(entrada.isIntersecting){
          confeti.lanzar(12);
          observer.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.5 });

    objetivos.forEach(el => observer.observe(el));
  })();

  /* ============================= */
  /* COUNTDOWN                     */
  /* ============================= */
  (function countdown(){
    const elDias = document.getElementById('days');
    const elHoras = document.getElementById('hours');
    const elMin = document.getElementById('minutes');
    const elSeg = document.getElementById('seconds');
    const mensaje = document.getElementById('countdownMsg');
    const anuncio = document.getElementById('cdAnuncio');
    if(!elDias || !elHoras || !elMin || !elSeg) return;

    const objetivo = new Date(CONFIG.fecha).getTime();
    let previos = { d: null, h: null, m: null, s: null };
    let intervalo = null;

    function anima(el, valorNuevo, clave){
      const texto = String(valorNuevo).padStart(2, '0');
      if(previos[clave] !== valorNuevo){
        el.textContent = texto;
        if(previos[clave] !== null && !prefersReducedMotion){
          el.classList.remove('flip');
          void el.offsetWidth;
          el.classList.add('flip');
        }
        previos[clave] = valorNuevo;
      }
    }

    function actualizar(){
      const ahora = Date.now();
      let diferencia = objetivo - ahora;

      if(diferencia <= 0){
        anima(elDias, 0, 'd'); anima(elHoras, 0, 'h');
        anima(elMin, 0, 'm'); anima(elSeg, 0, 's');
        if(mensaje) mensaje.hidden = false;
        if(anuncio) anuncio.textContent = '¡Hoy es el partido!';
        if(intervalo){ clearInterval(intervalo); intervalo = null; confeti.lanzar(18); }
        return;
      }

      const dias = Math.floor(diferencia / 86400000);
      const horas = Math.floor((diferencia % 86400000) / 3600000);
      const minutos = Math.floor((diferencia % 3600000) / 60000);
      const segundos = Math.floor((diferencia % 60000) / 1000);

      const diaCambio = previos.d !== dias;

      anima(elDias, dias, 'd');
      anima(elHoras, horas, 'h');
      anima(elMin, minutos, 'm');
      anima(elSeg, segundos, 's');

      if(diaCambio && anuncio){
        anuncio.textContent = `Faltan ${dias} días, ${horas} horas para el partido.`;
      }
    }

    actualizar();
    intervalo = setInterval(actualizar, 1000);
  })();

  /* ============================= */
  /* CANCHA INTERACTIVA            */
  /* ============================= */
  (function cancha(){
    const campo = document.getElementById('canchaCampo');
    if(!campo) return;

    let disparando = false;

    function disparar(){
      if(disparando || prefersReducedMotion) return;
      disparando = true;
      campo.classList.add('disparo');
      setTimeout(() => { campo.classList.remove('disparo'); disparando = false; }, 720);
    }

    campo.addEventListener('click', disparar);
    campo.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        disparar();
      }
    });
  })();

  /* ============================= */
  /* PARALLAX DEL HERO + CURSOR    */
  /* (comparten un único rAF)      */
  /* ============================= */
  (function visualAvanzado(){
    const interaccionesAvanzadas = esDesktopFino && !prefersReducedMotion;
    if(!interaccionesAvanzadas) return;

    const heroFoto = document.getElementById('heroFoto');
    const hero = document.getElementById('inicio');
    const cursorBalon = document.getElementById('cursorBalon');

    let scrollY = window.scrollY;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    let ticking = false;

    function solicitarFrame(){
      if(!ticking){
        ticking = true;
        requestAnimationFrame(actualizar);
      }
    }

    function actualizar(){
      ticking = false;

      if(heroFoto && hero){
        const alturaHero = hero.offsetHeight || window.innerHeight;
        const progreso = Math.min(Math.max(scrollY / alturaHero, 0), 1);
        heroFoto.style.transform = `translate3d(0, ${(progreso * 34).toFixed(1)}px, 0) scale(1.12)`;
      }

      if(cursorBalon){
        cursorX += (mouseX - cursorX) * 0.18;
        cursorY += (mouseY - cursorY) * 0.18;
        cursorBalon.style.transform = `translate3d(${(cursorX - 13).toFixed(1)}px, ${(cursorY - 13).toFixed(1)}px, 0)`;

        if(Math.abs(mouseX - cursorX) > 0.4 || Math.abs(mouseY - cursorY) > 0.4){
          solicitarFrame();
        }
      }
    }

    window.addEventListener('scroll', () => { scrollY = window.scrollY; solicitarFrame(); }, { passive: true });

    if(cursorBalon){
      document.body.classList.add('cursor-personalizado');
      cursorBalon.classList.add('activo');
      window.addEventListener('pointermove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        solicitarFrame();
      }, { passive: true });
      window.addEventListener('pointerleave', () => cursorBalon.classList.remove('activo'));
      window.addEventListener('pointerenter', () => cursorBalon.classList.add('activo'));
    }

    solicitarFrame();
  })();

  /* ============================= */
  /* MAGNETISMO EN BOTONES         */
  /* ============================= */
  (function botonesMagneticos(){
    if(!esDesktopFino || prefersReducedMotion) return;

    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${(relX * 0.12).toFixed(1)}px, ${(relY * 0.28).toFixed(1)}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  })();

  /* ============================= */
  /* TILT 3D — TARJETA DE JUGADOR  */
  /* ============================= */
  (function tiltTarjeta(){
    if(!esDesktopFino || prefersReducedMotion) return;
    const tarjeta = document.getElementById('tarjetaJugador');
    if(!tarjeta) return;

    tarjeta.addEventListener('pointermove', (e) => {
      const rect = tarjeta.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      tarjeta.style.transform = `rotate(-2.5deg) rotateX(${(relY * -6).toFixed(1)}deg) rotateY(${(relX * 6).toFixed(1)}deg)`;
    });
    tarjeta.addEventListener('pointerleave', () => {
      tarjeta.style.transform = 'rotate(-2.5deg)';
    });
  })();

});
