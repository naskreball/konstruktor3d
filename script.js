let currentStep = 1;
const totalSteps = 5; 
const state = { event:'', shape:'Круг', weight:0, portions:0, filling:'', gallery:'', text:'', hasPhoto:false, rotY: -20, rotX: -15, zoom: 1 };
const PRICE = 1550;

// --- THREE.JS ---
let scene, camera, renderer, cakeGroup, cakeMesh, cakeTopMesh;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let targetRotationX = -15;
let targetRotationY = -20;
let currentRotationX = -15;
let currentRotationY = -20;
let zoomLevel = 1;

function init3D() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    cakeGroup = new THREE.Group();
    scene.add(cakeGroup);

    // ТАРЕЛКА
    const plateBottomGeo = new THREE.CylinderGeometry(3.6, 3.4, 0.2, 64);
    const plateBottomMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.5 });
    const plateBottom = new THREE.Mesh(plateBottomGeo, plateBottomMat);
    plateBottom.position.y = -1.5;
    plateBottom.receiveShadow = true;
    cakeGroup.add(plateBottom);

    const plateTopGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.1, 64);
    const plateTopMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const plateMesh = new THREE.Mesh(plateTopGeo, plateTopMat);
    plateMesh.position.y = -1.35; 
    plateMesh.receiveShadow = true;
    cakeGroup.add(plateMesh);

    // НАДПИСЬ
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1024, 1024);
    
    ctx.fillStyle = '#9e1f24'; 
    ctx.font = 'bold 65px Montserrat';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = 'ЗОЛОТОЙ КОЛОС • ЭКСКЛЮЗИВНЫЕ ТОРТЫ • ';
    const angleStep = (Math.PI * 2) / text.length;
    const radius = 340; 
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const angle = i * angleStep; 
        ctx.save();
        ctx.translate(512 + Math.cos(angle) * radius, 512 + Math.sin(angle) * radius);
        ctx.rotate(angle + Math.PI / 2); 
        ctx.fillText(char, 0, 0);
        ctx.restore();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const textGeo = new THREE.PlaneGeometry(7.8, 7.8); 
    const textMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false });
    const textMesh = new THREE.Mesh(textGeo, textMat);
    textMesh.rotation.x = -Math.PI / 2; 
    textMesh.position.y = -1.33; 
    cakeGroup.add(textMesh);

    // ТОРТ (ОСНОВНОЙ)
    const cakeGeo = new THREE.CylinderGeometry(2.2, 2.2, 2.5, 64);
    const cakeMat = new THREE.MeshStandardMaterial({ color: 0x9e1f24, roughness: 0.6, metalness: 0.0, transparent: false, opacity: 1.0 });
    cakeMesh = new THREE.Mesh(cakeGeo, cakeMat);
    cakeMesh.position.y = -0.1; 
    cakeMesh.castShadow = true;
    cakeGroup.add(cakeMesh);

    // Верхний ярус (по умолчанию скрыт)
    const topCakeGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.2, 64);
    const topCakeMat = new THREE.MeshStandardMaterial({ color: 0x9e1f24, roughness: 0.6, metalness: 0.0 });
    cakeTopMesh = new THREE.Mesh(topCakeGeo, topCakeMat);
    cakeTopMesh.position.y = 1.25; 
    cakeTopMesh.castShadow = true;
    cakeTopMesh.visible = false;
    cakeGroup.add(cakeTopMesh);

    // Вращение
    renderer.domElement.addEventListener('mousedown', (e) => { isDragging = true; previousMousePosition = { x: e.offsetX, y: e.offsetY }; });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.offsetX - previousMousePosition.x;
        const deltaY = e.offsetY - previousMousePosition.y;
        targetRotationY += deltaX * 0.15; 
        targetRotationX += deltaY * 0.15;
        if (targetRotationX > 30) targetRotationX = 30;
        if (targetRotationX < -80) targetRotationX = -80;
        previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });
    window.addEventListener('mouseup', () => { isDragging = false; });

    renderer.domElement.addEventListener('touchstart', (e) => { isDragging = true; previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }; });
    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.15;
        targetRotationX += deltaY * 0.15;
        if (targetRotationX > 30) targetRotationX = 30;
        if (targetRotationX < -80) targetRotationX = -80;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });
    window.addEventListener('touchend', () => { isDragging = false; });

    window.addEventListener('resize', onWindowResize);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    currentRotationX += (targetRotationX - currentRotationX) * 0.1;
    currentRotationY += (targetRotationY - currentRotationY) * 0.1;

    if (cakeGroup) {
        cakeGroup.rotation.x = THREE.MathUtils.degToRad(currentRotationX);
        cakeGroup.rotation.y = THREE.MathUtils.degToRad(currentRotationY);
        cakeGroup.scale.set(zoomLevel, zoomLevel, zoomLevel);
    }
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if(!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function update3DColor(cat) {
    if (!cakeMesh) return;
    const colors = {
        'Шоколадные': 0x4a2c15, 'Кофейные': 0x7a4f2e, 'Медовые': 0xd49a35,
        'Фруктово-ягодные': 0xb83a50, 'Карамель': 0xb87e2e, 'С безе': 0xffffff,
        'С суфле': 0xd99a9a, 'Многокомпонентные': 0x6b4a4a, 'А еще...': 0x999999
    };
    if (colors[cat]) {
        cakeMesh.material.color.setHex(colors[cat]);
        if (cakeTopMesh) cakeTopMesh.material.color.setHex(colors[cat]);
    }
}

function update3DShape(shape) {
    if (!cakeMesh) return;
    
    // Сброс (убираем верхний ярус)
    cakeTopMesh.visible = false;
    
    // Удаляем старую геометрию
    cakeMesh.geometry.dispose(); 
    
    if (shape === 'Квадрат' || shape === 'Фигурный') {
        // Квадрат (и временно Фигурный тоже квадрат)
        cakeMesh.geometry = new THREE.BoxGeometry(3.8, 2.5, 3.8);
        cakeMesh.position.y = -0.1;
    } else if (shape === 'Многоярусный') {
        // Многоярусный: основной цилиндр меньше, сверху еще один
        cakeMesh.geometry = new THREE.CylinderGeometry(2.2, 2.2, 2.0, 64);
        cakeMesh.position.y = -0.35; // Опускаем ниже
        cakeTopMesh.visible = true;
    } else {
        // Круг
        cakeMesh.geometry = new THREE.CylinderGeometry(2.2, 2.2, 2.5, 64);
        cakeMesh.position.y = -0.1;
    }
}

function rotateLeft() { targetRotationY -= 15; }
function rotateRight() { targetRotationY += 15; }

// --- ИНТЕРФЕЙС ---
function startConstructor() {
    document.getElementById('hero-screen').classList.add('hidden');
    document.getElementById('constructor-app').style.display = 'flex';
    setTimeout(init3D, 100);
}

function setView(v) {
    document.getElementById('btn-3d').classList.toggle('active', v === '3d');
    document.getElementById('btn-top').classList.toggle('active', v === 'top');
    if (v === 'top') { targetRotationX = 90; targetRotationY = 0; } 
    else { targetRotationX = -15; targetRotationY = -20; }
}

function zoomCake(d) {
    zoomLevel += d;
    if (zoomLevel < 0.5) zoomLevel = 0.5;
    if (zoomLevel > 1.5) zoomLevel = 1.5;
    document.getElementById('zoom-val').innerText = Math.round(zoomLevel * 100) + '%';
}

function updateUI() {
    document.querySelectorAll('.step-indicator').forEach((el, i) => el.classList.toggle('active', i + 1 <= currentStep));
    document.getElementById('f-back').style.display = currentStep === 1 ? 'none' : 'block';
    document.getElementById('f-next').style.display = currentStep === totalSteps ? 'none' : 'block';

    let canNext = false;
    if (currentStep === 1) canNext = !!state.event;
    if (currentStep === 2) canNext = state.weight > 0;
    if (currentStep === 3) canNext = !!state.filling;
    if (currentStep === 4) canNext = true;
    if (currentStep === 5) canNext = true;
    
    const nextBtn = document.getElementById('f-next');
    if(nextBtn) {
        nextBtn.disabled = !canNext;
        nextBtn.style.opacity = canNext ? '1' : '0.5';
    }

    if (currentStep === 5) {
        document.getElementById('sum-event').innerText = state.event || '-';
        document.getElementById('sum-shape').innerText = state.shape || '-';
        document.getElementById('sum-weight').innerText = state.weight ? state.weight.toFixed(1) + ' кг' : '-';
        document.getElementById('sum-portions').innerText = state.portions || '-';
        document.getElementById('sum-filling').innerText = state.filling || '-';
        document.getElementById('sum-text').innerText = state.text || '-';
    }
}

function goToStep(s) {
    document.querySelectorAll('.step-content-block').forEach(b => b.classList.remove('active'));
    document.getElementById(`step-${s}`).classList.add('active');
    currentStep = s;
    updateUI();
    updateStatusLeft();
}
function nextStep() { if (currentStep < totalSteps) goToStep(currentStep + 1); }
function prevStep() { if (currentStep > 1) goToStep(currentStep - 1); }

function clearActive(id) { document.getElementById(id)?.querySelectorAll('.opt-btn, .opt-card, .f-item, .g-item').forEach(e => e.classList.remove('active')); }

function selectEvent(val, el) {
    state.event = val; clearActive('event-options'); el.classList.add('active'); updateUI();
}
function selectCustomEvent(val) { if(val.trim()) { state.event = val; clearActive('event-options'); updateUI(); } }

function selectShape(val, el) {
    state.shape = val; clearActive('shape-options'); el.classList.add('active');
    update3DShape(val);
    renderFillings(val);
    updateStatusLeft();
}

function selectWeight(val, el) {
    state.weight = val; clearActive('weight-options'); el.classList.add('active');
    updateWeightLogic(val);
}
function selectCustomWeight(val) {
    const w = parseFloat(val);
    if (w >= 2) { state.weight = w; clearActive('weight-options'); updateWeightLogic(w); }
}
function updateWeightLogic(w) {
    state.portions = Math.floor(w * 1000 / 150);
    document.getElementById('portions').innerText = state.portions;
    document.getElementById('calc-info').style.display = 'block';
    document.getElementById('guest-count').innerText = state.portions;
    document.getElementById('guest-slider').value = Math.min(state.portions, 25);
    updatePrice(); updateUI(); updateStatusLeft();
}

function changeGuests(d) {
    let val = parseInt(document.getElementById('guest-slider').value) + d;
    if (val < 1) val = 1;
    if (val > 25) val = 25;
    document.getElementById('guest-slider').value = val;
    handleSlider(val);
}
function handleSlider(val) {
    document.getElementById('guest-count').innerText = val;
    let w = (val * 150) / 1000;
    state.weight = w;
    state.portions = val;
    document.getElementById('portions').innerText = val;
    document.getElementById('calc-info').style.display = 'block';
    updatePrice(); updateUI(); updateStatusLeft();
}

const fillingData = {
    'Шоколадные': 11, 'Кофейные': 8, 'Медовые': 4, 'Фруктово-ягодные': 13,
    'Карамель': 4, 'С безе': 3, 'С суфле': 3, 'Многокомпонентные': 4, 'А еще...': 5
};

function renderFillings(shape) {
    const cont = document.getElementById('filling-cats');
    cont.innerHTML = '';
    let cats = Object.keys(fillingData);
    
    if (shape === 'Фигурный') cats = cats.filter(c => c !== 'Многокомпонентные');
    if (shape === 'Многоярусный') cats = ['Шоколадные', 'Фруктово-ягодные', 'Медовые'];

    cats.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = `cat-btn ${i === 0 ? 'active' : ''}`;
        b.innerText = c;
        b.onclick = () => { document.querySelectorAll('.cat-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderFillingItems(c); };
        cont.appendChild(b);
    });
    if (cats.length) renderFillingItems(cats[0]);
}

function renderFillingItems(cat) {
    const grid = document.getElementById('filling-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= fillingData[cat]; i++) {
        const d = document.createElement('div');
        d.className = 'f-item';
        d.innerHTML = `<div class="f-photo"></div>#${i}`;
        d.onclick = function() {
            clearActive('filling-grid'); this.classList.add('active');
            state.filling = cat + ' #' + i;
            update3DColor(cat);
            updateUI(); updatePrice();
        };
        grid.appendChild(d);
    }
}

function switchGalleryTab(tab, btn) {
    document.querySelectorAll('.g-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    for(let i=1; i<=10; i++) {
        const d = document.createElement('div');
        d.className = 'g-item'; d.innerText = `Фото ${i}`;
        d.onclick = function() { clearActive('gallery-grid'); this.classList.add('active'); state.gallery = tab + ' #' + i; };
        grid.appendChild(d);
    }
}
function uploadPhoto(e) { if(e.target.files[0]) { state.hasPhoto = true; alert('Фото загружено (симуляция)'); } }
function selectCustomText(val) { state.text = val; }
function toggleNoText(c) { const inp = document.getElementById('cake-text'); inp.value = c ? 'Без надписи' : ''; inp.disabled = c; state.text = inp.value; }

function updatePrice() {
    const p = state.weight * PRICE;
    document.getElementById('f-price').innerText = Math.round(p).toLocaleString('ru-RU') + ' ₽';
}

function updateStatusLeft() {
    let s = state.shape || 'Круг';
    let w = state.weight ? state.weight.toFixed(1) + ' кг' : '— кг';
    document.getElementById('v-status').innerText = `${s} • ${w}`;
}

document.addEventListener('DOMContentLoaded', () => {
    renderFillings('Круг');
    switchGalleryTab('Праздничные', document.querySelector('.g-tab'));
    updateUI();
    
    document.getElementById('f-phone').addEventListener('input', function() {
        let v = this.value.replace(/\D/g, '');
        if(v.length === 0) { this.value = ''; return check(); }
        if(v[0] === '8') v = '7' + v.slice(1);
        if(v[0] !== '7') v = '7' + v;
        let r = '+7 ';
        if(v.length > 1) r += '(' + v.slice(1,4);
        if(v.length > 4) r += ') ' + v.slice(4,7);
        if(v.length > 7) r += '-' + v.slice(7,9);
        if(v.length > 9) r += '-' + v.slice(9,11);
        this.value = r; check();
    });
    
    document.querySelectorAll('#order-form input[required]').forEach(i => i.addEventListener('input', check));
    document.getElementById('f-agree').addEventListener('change', check);
});

function check() {
    const n = document.getElementById('f-name').value.trim();
    const p = document.getElementById('f-phone').value.replace(/\D/g, '');
    const d = document.getElementById('f-date').value;
    const a = document.getElementById('f-agree').checked;
    document.getElementById('submit-btn').disabled = !(n.length > 1 && p.length === 11 && d && a);
}

function submitOrder(e) { e.preventDefault(); alert('Заказ успешно отправлен! (Прототип)'); }