
// Custom Google Reviews Popup
(function(){
  if(window.innerWidth < 769) return; // Skip on mobile
  
  var css = `.br-review-popup{position:fixed;bottom:20px;right:20px;z-index:9999;background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.2);width:360px;max-width:90vw;overflow:hidden;font-family:Montserrat,sans-serif;display:none;animation:brSlideIn .4s ease}
.br-review-popup.show{display:block}@keyframes brSlideIn{from{transform:translateY(100px);opacity:0}to{transform:translateY(0);opacity:1}}
.br-review-header{background:#2257A6;color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
.br-review-header h3{margin:0;font-size:16px;color:#fff}
.br-review-close{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;padding:0;line-height:1}
.br-review-body{padding:16px 20px;max-height:350px;overflow-y:auto}
.br-review-card{padding:12px 0;border-bottom:1px solid #eee}
.br-review-card:last-child{border-bottom:none}
.br-review-stars{color:#f86f26;font-size:14px;margin-bottom:4px}
.br-review-name{font-weight:700;font-size:13px;color:#333}
.br-review-text{font-size:12px;color:#666;margin-top:4px;line-height:1.5}
.br-review-time{font-size:10px;color:#999;margin-top:2px}
.br-review-footer{text-align:center;padding:12px 20px;border-top:1px solid #eee}
.br-review-btn{display:inline-block;background:#f86f26;color:#fff!important;padding:10px 24px;border-radius:25px;text-decoration:none;font-size:14px;font-weight:600;transition:background .3s}
.br-review-btn:hover{background:#e05a15}
.br-review-trigger{position:fixed;bottom:20px;right:20px;z-index:9998;background:#2257A6;color:#fff;border:none;border-radius:50px;padding:12px 22px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.2);display:flex;align-items:center;gap:8px;font-family:Montserrat,sans-serif}
.br-review-trigger:hover{background:#1a447d}
.br-review-trigger .stars{color:#f86f26;font-size:18px}
.br-review-loading{text-align:center;padding:20px;color:#999;font-size:13px}
`;
  
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  
  var trigger = document.createElement('button');
  trigger.className = 'br-review-trigger';
  trigger.innerHTML = '<span class="stars">★★★★★</span> Reviews';
  document.body.appendChild(trigger);
  
  var popup = document.createElement('div');
  popup.className = 'br-review-popup';
  popup.innerHTML = `
    <div class="br-review-header">
      <h3>★★★★★ Our Reviews</h3>
      <button class="br-review-close">&times;</button>
    </div>
    <div class="br-review-body"><div class="br-review-loading">Loading reviews...</div></div>
    <div class="br-review-footer">
      <a href="https://search.google.com/local/writereview?placeid=ChIJicdBse3mnYARzUlONkU2Rs0" target="_blank" class="br-review-btn">Leave Us a Review</a>
    </div>
  `;
  document.body.appendChild(popup);
  
  var loaded = false;
  async function loadReviews(){
    if(loaded) return;
    loaded = true;
    try {
      var resp = await fetch('/api/reviews');
      var data = await resp.json();
      var body = popup.querySelector('.br-review-body');
      if(!data.reviews || !data.reviews.length){
        body.innerHTML = '<p style="text-align:center;color:#999;padding:20px">No reviews yet. Be the first!</p>';
        return;
      }
      body.innerHTML = data.reviews.map(function(r){
        return '<div class="br-review-card">' +
          '<div class="br-review-stars">' + '★'.repeat(r.rating) + '</div>' +
          '<div class="br-review-name">' + r.name + '</div>' +
          '<div class="br-review-text">' + r.text + '</div>' +
          '<div class="br-review-time">' + r.time + '</div>' +
          '</div>';
      }).join('');
    } catch(e) {
      popup.querySelector('.br-review-body').innerHTML = '<p style="text-align:center;color:#999;padding:20px">Could not load reviews.</p>';
    }
  }
  
  trigger.addEventListener('click', function(){
    popup.classList.toggle('show');
    loadReviews();
  });
  
  popup.querySelector('.br-review-close').addEventListener('click', function(){
    popup.classList.remove('show');
  });
  
  // Close on outside click
  document.addEventListener('click', function(e){
    if(!popup.contains(e.target) && e.target !== trigger){
      popup.classList.remove('show');
    }
  });
  
  // Show after 5 seconds
  setTimeout(function(){
    popup.classList.add('show');
    loadReviews();
  }, 5000);
})();
