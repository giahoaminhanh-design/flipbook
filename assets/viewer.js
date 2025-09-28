
(function(){
  const bar = document.getElementById('bar');
  const pageNumEl = document.getElementById('pageNum');
  const pageTotalEl = document.getElementById('pageTotal');
  const flipbook = document.getElementById('flipbook');

  const Full = {
    toggle(){
      const el = document.documentElement;
      if(!document.fullscreenElement){ el.requestFullscreen?.(); }
      else { document.exitFullscreen?.(); }
    }
  };

  function setProgress(p){
    if(bar) bar.style.width = Math.max(0, Math.min(100, p)) + '%';
  }

  // Render PDF pages to images using pdf.js, then init turn.js
  async function buildFlipbook(){
    const pdfjsLib = window['pdfjsLib'];
    if (!pdfjsLib) return;

    const loadingTask = pdfjsLib.getDocument({url: window.PDF_URL});
    const pdf = await loadingTask.promise;
    const total = pdf.numPages;
    pageTotalEl.textContent = total;

    const pages = [];
    for(let i=1;i<=total;i++){
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 }); // 2x for decent quality
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataURL = canvas.toDataURL('image/jpeg', 0.92);
      pages.push(dataURL);
      setProgress((i/total)*100);
    }

    // Clear flipbook container
    flipbook.innerHTML = '';

    // Create page divs
    pages.forEach(src => {
      const d = document.createElement('div');
      d.className = 'page';
      const img = new Image();
      img.src = src;
      img.alt = 'Page';
      d.appendChild(img);
      flipbook.appendChild(d);
    });

    // Initialize turn.js
    const $fb = window.jQuery && jQuery(flipbook);
    if ($fb && $fb.turn){
      $fb.turn({ width: Math.min(1000, flipbook.clientWidth), height: 640, autoCenter: true, gradients: true, elevation: 50 });
      $fb.on('turned', function(e, page){
        pageNumEl.textContent = page;
      });
      // Set initial page display
      pageNumEl.textContent = 1;

      // Controls
      document.getElementById('btnPrev')?.addEventListener('click', ()=> $fb.turn('previous'));
      document.getElementById('btnNext')?.addEventListener('click', ()=> $fb.turn('next'));
      document.getElementById('btnFull')?.addEventListener('click', ()=> Full.toggle());

      // Keyboard
      document.addEventListener('keydown', (e)=>{
        if(e.key === 'ArrowLeft') $fb.turn('previous');
        if(e.key === 'ArrowRight') $fb.turn('next');
      });

      // Resize: reinit size
      window.addEventListener('resize', ()=>{
        try{ $fb.turn('size', Math.min(1000, flipbook.clientWidth), 640); }catch{}
      });
    } else {
      // Fallback: simple pager
      let idx = 0;
      function render(){
        flipbook.innerHTML = '';
        const d = document.createElement('div');
        d.className = 'page';
        const img = new Image();
        img.src = pages[idx];
        d.appendChild(img);
        flipbook.appendChild(d);
        pageNumEl.textContent = (idx+1);
      }
      render();
      document.getElementById('btnPrev')?.addEventListener('click', ()=> { idx=Math.max(0,idx-1); render(); });
      document.getElementById('btnNext')?.addEventListener('click', ()=> { idx=Math.min(pages.length-1,idx+1); render(); });
      document.getElementById('btnFull')?.addEventListener('click', ()=> Full.toggle());
    }
  }

  document.addEventListener('DOMContentLoaded', buildFlipbook);
})();
