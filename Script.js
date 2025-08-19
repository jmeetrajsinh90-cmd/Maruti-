/* NAVIGATION */
const links = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('.page');
const navLinks = document.getElementById('navLinks');

document.getElementById('menuToggle').addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

links.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    links.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const id = link.dataset.page;
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    navLinks.classList.remove('active');

    // Lazy draw charts when visiting Sales/Finance for the first time
    if (id === 'sales' && !drawn.sales) drawSalesBar();
    if (id === 'finance' && !drawn.emi) drawEMIChart();
    if (id === 'home' && !drawn.home) drawHomeTrend();
  });
});

/* ---------- SIMPLE CHART HELPERS (Canvas, no libs) ---------- */
function drawLine(ctx, points, color="#2ea7ff"){
  ctx.beginPath();
  for (let i=0; i<points.length; i++){
    const [x,y]=points[i];
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawBars(ctx, bars, color="#36d399"){
  ctx.fillStyle = color;
  bars.forEach(b => {
    const {x,y,w,h} = b;
    ctx.fillRect(x,y,w,h);
  });
}

function axes(ctx, w, h, margin=50){
  ctx.strokeStyle="rgba(255,255,255,0.3)";
  ctx.lineWidth=1;
  // X axis
  ctx.beginPath();
  ctx.moveTo(margin, h-margin);
  ctx.lineTo(w-margin, h-margin);
  ctx.stroke();
  // Y axis
  ctx.beginPath();
  ctx.moveTo(margin, h-margin);
  ctx.lineTo(margin, margin);
  ctx.stroke();
  return {origin:[margin,h-margin], area:[w-2*margin, h-2*margin]};
}

/* ---------- HOME TREND CHART ---------- */
const drawn = {home:false, sales:false, emi:false};

function drawHomeTrend(){
  const c = document.getElementById('homeTrend');
  if(!c) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);

  const {origin, area} = axes(ctx, c.width, c.height);

  // Fake monthly trend points (normalized)
  const months = 8;
  const vals = [120, 135, 140, 160, 155, 170, 180, 190]; // thousands
  const max = Math.max(...vals)*1.15;
  const stepX = area[0]/(months-1);

  const pts = vals.map((v,i)=>[
    origin[0] + i*stepX,
    origin[1] - (v/max)*area[1]
  ]);

  // Draw grid lines
  ctx.strokeStyle="rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for(let i=0;i<months;i++){
    const x = origin[0] + i*stepX;
    ctx.beginPath();
    ctx.moveTo(x, origin[1]);
    ctx.lineTo(x, origin[1]-area[1]);
    ctx.stroke();
  }

  // Draw trend line
  drawLine(ctx, pts, "#2ea7ff");

  // Add title
  ctx.fillStyle = "#e9eef6";
  ctx.font = "16px system-ui";
  ctx.fillText("Sales Trend (Monthly)", 60, 30);

  drawn.home = true;
}

/* ---------- SALES BAR CHART ---------- */
function drawSalesBar(){
  const c = document.getElementById('salesBar');
  if(!c) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);

  const {origin, area} = axes(ctx, c.width, c.height);

  // Data from table (March units)
  const labels = ["Mini","Compact","Mid-Size","Utility","Vans","LCV"];
  const data = [15491, 82314, 1834, 25001, 9221, 3797];
  const max = Math.max(...data)*1.2;
  const barW = area[0]/(labels.length*1.8);

  data.forEach((v,i)=>{
    const x = origin[0] + (i* (area[0]/labels.length)) + (barW*.4);
    const h = (v/max)*area[1];
    const y = origin[1] - h;

    // Draw bar
    drawBars(ctx, [{x, y, w: barW, h}], "#36d399");

    // Add label
    ctx.fillStyle="#cfe9ff";
    ctx.font="12px system-ui";
    ctx.fillText(labels[i], x, origin[1]+16);

    // Add value
    ctx.fillStyle="#e9eef6";
    ctx.font="10px system-ui";
    ctx.fillText(v.toLocaleString(), x, y-5);
  });

  // Title
  ctx.fillStyle = "#e9eef6";
  ctx.font = "16px system-ui";
  ctx.fillText("Sales by Category (March Units)", 60, 30);

  drawn.sales = true;
}

/* ---------- FINANCE: EMI CALC + CHART ---------- */
function calcEMI(P, annualR, nMonths){
  const r = (annualR/12)/100;
  if(r===0) return P/nMonths;
  return P * r * Math.pow(1+r, nMonths) / (Math.pow(1+r, nMonths)-1);
}

function numberINR(x){
  return "₹ " + Math.round(x).toLocaleString('en-IN');
}

function drawEMIChart(){
  const c = document.getElementById('emiChart');
  if(!c) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);

  const {origin, area} = axes(ctx, c.width, c.height);

  // Using last calculated numbers stored on window
  const P = window._emi?.P ?? 800000;
  const T = window._emi?.n ?? 60;
  const A = window._emi?.A ?? calcEMI(P, 9, T)*T; // total payment
  const I = A - P; // total interest

  const vals = [P, I];
  const labels = ["Principal","Interest"];
  const colors = ["#2ea7ff", "#ffb84d"];
  const max = Math.max(...vals)*1.2;
  const barW = area[0]/(vals.length*2.5);

  vals.forEach((v,i)=>{
    const x = origin[0] + i*(area[0]/vals.length) + (barW*.5);
    const h = (v/max)*area[1];
    const y = origin[1] - h;

    // Draw bar
    drawBars(ctx, [{x, y, w: barW, h}], colors[i]);

    // Labels
    ctx.fillStyle="#cfe9ff";
    ctx.font="12px system-ui";
    ctx.fillText(labels[i], x, origin[1]+16);

    // Values
    ctx.fillStyle="#e9eef6";
    ctx.font="11px system-ui";
    ctx.fillText(numberINR(v), x, y-8);
  });

  // Title
  ctx.fillStyle = "#e9eef6";
  ctx.font = "16px system-ui";
  ctx.fillText("Principal vs Interest Breakdown", 60, 30);

  drawn.emi = true;
}

/* EMI FORM HANDLER */
const emiForm = document.getElementById('emiForm');
if (emiForm){
  emiForm.addEventListener('submit', e=>{
    e.preventDefault();
    const P = parseFloat(document.getElementById('loanAmt').value || 0);
    const R = parseFloat(document.getElementById('loanRate').value || 0);
    const N = parseInt(document.getElementById('loanTenure').value || 0, 10);

    if(P <= 0 || R <= 0 || N <= 0) {
      alert('Please enter valid values for all fields');
      return;
    }

    const emi = calcEMI(P, R, N);
    const totalPay = emi * N;
    const totalInt = totalPay - P;

    document.getElementById('emiVal').textContent = numberINR(emi);
    document.getElementById('totalInt').textContent = numberINR(totalInt);
    document.getElementById('totalPay').textContent = numberINR(totalPay);

    // Store for chart
    window._emi = {P, n:N, A: totalPay};
    drawEMIChart();
  });
}

/* SERVICE BOOKING FORM (demo only) */
const svcForm = document.getElementById('serviceForm');
if (svcForm){
  svcForm.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('svcName').value.trim();
    const model = document.getElementById('svcModel').value.trim();
    const date = document.getElementById('svcDate').value;
    const type = document.getElementById('svcType').value;
    const msgEl = document.getElementById('svcMsg');

    if(!name || !model || !date || !type){
      msgEl.textContent = "Please fill all required fields.";
      msgEl.style.color = "#ff6b6b";
      return;
    }

    // Simulate booking storage
    const booking = {
      name, model, date, type,
      notes: document.getElementById('svcNotes').value.trim(),
      timestamp: new Date().toISOString()
    };

    window.serviceBookings = window.serviceBookings || [];
    window.serviceBookings.push(booking);

    msgEl.textContent = "Booking submitted successfully! Our team will contact you soon.";
    msgEl.style.color = "#36d399";
    svcForm.reset();

    setTimeout(() => { msgEl.textContent = ""; }, 5000);
  });
}

/* ---------- AUTH: MERGED SIGNUP + LOGIN + LOGOUT ---------- */
// Toggle buttons
const btnShowLogin = document.getElementById('showLogin');
const btnShowSignup = document.getElementById('showSignup');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

if (btnShowLogin && btnShowSignup){
  btnShowLogin.addEventListener('click', () => switchAuth('login'));
  btnShowSignup.addEventListener('click', () => switchAuth('signup'));
}

function switchAuth(which){
  if(!loginForm || !signupForm) return;
  if(which === 'login'){
    loginForm.style.display = 'grid';
    signupForm.style.display = 'none';
    btnShowLogin.classList.add('active');
    btnShowSignup.classList.remove('active');
  }else{
    loginForm.style.display = 'none';
    signupForm.style.display = 'grid';
    btnShowSignup.classList.add('active');
    btnShowLogin.classList.remove('active');
  }
}

// Signup (reuses your original localStorage structure)
if (signupForm){
  signupForm.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const user = document.getElementById('signupUser').value.trim();
    const pass = document.getElementById('signupPass').value;
    const msgEl = document.getElementById('signupMsg');

    if(!name || !email || !user || !pass){
      msgEl.textContent = "Please fill all required fields.";
      msgEl.style.color = "#ff6b6b";
      return;
    }

    if(pass.length < 4){
      msgEl.textContent = "Password must be at least 4 characters long.";
      msgEl.style.color = "#ff6b6b";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
      msgEl.textContent = "Please enter a valid email address.";
      msgEl.style.color = "#ff6b6b";
      return;
    }

    try {
      localStorage.setItem('user_profile', JSON.stringify({name, email, user}));
      localStorage.setItem('user_auth', JSON.stringify({user, pass}));

      msgEl.textContent = "Account created successfully! You can now login.";
      msgEl.style.color = "#36d399";
      signupForm.reset();
      switchAuth('login');
      setTimeout(()=>{ msgEl.textContent = ""; }, 5000);
    } catch(e) {
      msgEl.textContent = "Error creating account. Please try again.";
      msgEl.style.color = "#ff6b6b";
    }
  });
}

// Login
if (loginForm){
  loginForm.addEventListener('submit', e=>{
    e.preventDefault();
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value;
    const msgEl = document.getElementById('loginMsg');

    if(!u || !p) {
      msgEl.textContent = "Please enter both username and password.";
      msgEl.style.color = "#ff6b6b";
      return;
    }

    try {
      const auth = JSON.parse(localStorage.getItem('user_auth') || "{}");

      if(auth.user === u && auth.pass === p){
        const profile = JSON.parse(localStorage.getItem('user_profile') || "{}");
        msgEl.textContent = `Welcome back, ${profile.name || u}!`;
        msgEl.style.color = "#36d399";

        // Store login state
        sessionStorage.setItem('logged_in', 'true');
        sessionStorage.setItem('current_user', u);

        updateAuthUI();
      } else {
        msgEl.textContent = "Invalid username or password!";
        msgEl.style.color = "#ff6b6b";
      }
    } catch(e) {
      msgEl.textContent = "Error during login. Please try again.";
      msgEl.style.color = "#ff6b6b";
    }

    setTimeout(() => { msgEl.textContent = ""; }, 5000);
  });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn){
  logoutBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    sessionStorage.removeItem('logged_in');
    sessionStorage.removeItem('current_user');
    updateAuthUI();
    // Take user to Auth page
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById('auth').classList.add('active');
    // activate nav link highlight
    document.querySelectorAll('.nav-links a').forEach(l=>l.classList.remove('active'));
    const authLink = document.querySelector('[data-page="auth"]');
    if(authLink) authLink.classList.add('active');
  });
}

// Navbar user UI update
function updateAuthUI(){
  const isIn = sessionStorage.getItem('logged_in') === 'true';
  const userWrap = document.getElementById('navUserWrap');
  const userBadge = document.getElementById('navUserName');
  const authNavItem = document.getElementById('authNavItem');

  if(isIn){
    const user = sessionStorage.getItem('current_user');
    const profile = JSON.parse(localStorage.getItem('user_profile') || "{}");
    const display = profile.name ? `${profile.name}` : user || 'User';
    userBadge.textContent = display;
    userWrap.style.display = 'flex';
    authNavItem.style.display = 'none';

    // Jump to home & draw initial chart if needed
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById('home').classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(l=>l.classList.remove('active'));
    const homeLink = document.querySelector('[data-page="home"]');
    if(homeLink) homeLink.classList.add('active');
  } else {
    userWrap.style.display = 'none';
    authNavItem.style.display = '';
  }
}

/* INITIAL SETUP */
window.addEventListener('load', () => {
  // Draw initial chart for home page
  setTimeout(() => { drawHomeTrend(); }, 100);

  // Restore login state UI
  updateAuthUI();

  // Set minimum date for service booking to today
  const dateInput = document.getElementById('svcDate');
  if(dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  // Default Auth view = login
  switchAuth('login');
});

/* UTILITY: Simple notification (kept from your original approach) */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
    background: ${type === 'success' ? '#36d399' : type === 'error' ? '#ff6b6b' : '#2ea7ff'};
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => { notification.remove(); }, 4000);
}

// Add CSS animation for notifications dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);

/* SMOOTH SCROLL helper (kept) */
function smoothScrollTo(element) {
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* FORM RESET helper (kept) */
function resetAllForms() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.reset();
    const msgs = form.querySelectorAll('.msg');
    msgs.forEach(msg => msg.textContent = '');
  });
}

console.log('Maruti Suzuki Portal JavaScript loaded with merged Auth + logout.');
