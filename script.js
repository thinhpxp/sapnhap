document.addEventListener('DOMContentLoaded', () => {

     // === PHÁT HIỆN NGÔN NGỮ HIỆN TẠI ===
    const currentLang = document.documentElement.lang || 'vi';
    // === Lấy bản dịch hoặc một đối tượng rỗng nếu không có ===
    const translations = window.translations || {};

    // === Hàm tiện ích để lấy bản dịch một cách an toàn ===
    // Cung cấp một giá trị dự phòng nếu khóa không tồn tại
    const t = (key, fallback = '') => translations[key] || fallback;

    // === KHÓA API (CHỈ DÀNH CHO MYSTERY BOX) ===
    const UNSPLASH_ACCESS_KEY = 'Ln1_SF9l3ee_fsc320rUZjfB5fgSVCZlMg2JbSdh_XY';

    // === DOM Elements ===
    const lookupBtn = document.getElementById('lookup-btn');
    const resultContainer = document.getElementById('result-container');
    const oldAddressDisplay = document.getElementById('old-address-display');
    const newAddressDisplay = document.getElementById('new-address-display');
    const notificationArea = document.getElementById('notification-area');
    const mysteryBox = document.getElementById('mystery-box');
    const spinner = mysteryBox ? mysteryBox.querySelector('.loading-spinner') : null;
    const modeToggle = document.getElementById('mode-toggle');
    const lookupDescription = document.getElementById('lookup-description');
    const forwardControls = document.getElementById('forward-controls');
    const reverseControls = document.getElementById('reverse-controls');
    const provinceSelectEl = document.getElementById('province-select');
    const districtSelectEl = document.getElementById('district-select');
    const communeSelectEl = document.getElementById('commune-select');
    const newProvinceSelectEl = document.getElementById('new-province-select');
    const newCommuneSelectEl = document.getElementById('new-commune-select');

    // === BIỂU TƯỢNG SVG ===
    const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>`;
    const copiedIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard-check" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>`;

       // === QUẢN LÝ TRẠNG THÁI ===
    let isReverseMode = false;
    let removeAccents = false; // Mặc định là không loại bỏ dấu
    let provinceChoices, districtChoices, communeChoices;
    let newProvinceChoices, newCommuneChoices;

    // === CÁC HÀM TIỆN ÍCH ===

    function toNormalizedString(str) {
        if (!str) return '';
        str = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function showNotification(message, type = 'loading') {
        if (notificationArea) {
            notificationArea.textContent = message;
            notificationArea.className = type;
            notificationArea.classList.remove('hidden');
        } else {
            console.warn("Notification Area not found. Message:", message);
        }
    }
    function hideNotification() { notificationArea.classList.add('hidden'); notificationArea.textContent = ''; }
    function updateChoices(choicesInstance, placeholder, data, valueKey = 'code', labelKey = 'name') {
        choicesInstance.clearStore();
        choicesInstance.setChoices(
            [{ value: '', label: placeholder, selected: true, disabled: true }, ...data.map(item => ({ value: item[valueKey], label: item[labelKey] }))],
            'value', 'label', false
        );
    }
    function resetChoice(choicesInstance, placeholder) {
        choicesInstance.clearStore();
        choicesInstance.setChoices([{ value: '', label: placeholder, selected: true, disabled: true }], 'value', 'label', false);
        choicesInstance.disable();
    }

    // === HÀM DỊCH THUẬT & BẢN ĐỊA HÓA ===
    function applyTranslations() {
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.getAttribute('data-i18n-key');
            el.innerHTML = t(key, el.innerHTML); // Dùng text cũ làm fallback
        });

        document.title = t('pageTitle', "Tra Cứu Sáp Nhập");
        const descEl = document.querySelector('meta[name="description"]');
        const ogTitleEl = document.querySelector('meta[property="og:title"]');
        const ogDescEl = document.querySelector('meta[property="og:description"]');

        if (descEl) descEl.setAttribute('content', t('pageDescription'));
        if (ogTitleEl) ogTitleEl.setAttribute('content', t('ogTitle'));
        if (ogDescEl) ogDescEl.setAttribute('content', t('ogDescription'));
    }
     // Hàm mới để xử lý tên địa danh theo ngôn ngữ VÀ checkbox
    function localize(name, en_name) {
        if (currentLang === 'en') {
            // Nếu checkbox được chọn, dùng tên tiếng Anh không dấu từ CSDL
            // Nếu không, dùng tên gốc có dấu
            return removeAccents ? en_name : name;
        }
        // Luôn trả về tên gốc cho tiếng Việt
        return name;
    }


    // === CÁC HÀM KHỞI TẠO & GIAO DIỆN ===
    function initialize() {
        applyTranslations();

        if (currentLang === 'en' && localizationToggleContainer) {
            localizationToggleContainer.classList.remove('hidden');
            removeAccents = removeDiacriticsToggle.checked;
        }
        // ... (khởi tạo Choices.js giữ nguyên)
        const choicesConfig = { searchEnabled: true, itemSelectText: t('selectChoice', 'Chọn'), removeItemButton: true, searchPlaceholderValue: "..." };

        provinceChoices = new Choices(provinceSelectEl, { ...choicesConfig });
        districtChoices = new Choices(districtSelectEl, { ...choicesConfig });
        communeChoices = new Choices(communeSelectEl, { ...choicesConfig });
        newProvinceChoices = new Choices(newProvinceSelectEl, { ...choicesConfig });
        newCommuneChoices = new Choices(newCommuneSelectEl, { ...choicesConfig });

        if (window.allProvincesData && window.allProvincesData.length > 0) {
            // THAY ĐỔI: Sử dụng hàm toNormalizedString để tạo phiên bản không dấu cho dữ liệu cũ
            const localizedOldData = window.allProvincesData.map(province => ({
                ...province,
                name: removeAccents ? toNormalizedString(province.name) : province.name,
                districts: province.districts.map(district => ({
                    ...district,
                    name: removeAccents ? toNormalizedString(district.name) : district.name,
                    wards: district.wards.map(ward => ({
                        ...ward,
                        name: removeAccents ? toNormalizedString(ward.name) : ward.name
                    }))
                }))
            }));
            updateChoices(provinceChoices, t('oldProvincePlaceholder'), localizedOldData);
        } else {
            showNotification(t('errorLoadOldData'), "error");
        }

        resetChoice(districtChoices, t('oldDistrictPlaceholder'));
        resetChoice(communeChoices, t('oldCommunePlaceholder'));
        resetChoice(newCommuneChoices, t('newCommunePlaceholder'));

        addEventListeners();
        loadNewProvincesDropdown();
    }

    async function loadNewProvincesDropdown() {
        resetChoice(newProvinceChoices, t('newProvinceLoading'));
        try {
            const response = await fetch('/api/get-new-provinces');
            if(!response.ok) throw new Error(t('errorFetchNewProvinces'));
            let data = await response.json();

            const localizedData = data.map(province => ({
                ...province,
                name: localize(province.name, province.en_name)
            }));

            updateChoices(newProvinceChoices, t('newProvincePlaceholder'), localizedData, 'province_code', 'name');
            newProvinceChoices.enable();
        } catch (error) { /* ... */ }
    }

    function toggleLookupUI() {
        isReverseMode = modeToggle.checked;
        forwardControls.classList.toggle('hidden', isReverseMode);
        reverseControls.classList.toggle('hidden', !isReverseMode);
        resultContainer.classList.add('hidden');
        lookupBtn.disabled = true;
        lookupDescription.textContent = isReverseMode
            ? t('lookupDescriptionNewToOld')
            : t('lookupDescriptionOldToNew');
    }

    // === LẮNG NGHE SỰ KIỆN ===
    function addEventListeners() {
        if(modeToggle) modeToggle.addEventListener('change', toggleLookupUI);
        if(lookupBtn) lookupBtn.addEventListener('click', () => {
            if (isReverseMode) handleReverseLookup();
            else handleForwardLookup();
        });
        if (mysteryBox) mysteryBox.addEventListener('click', fetchRandomImage);
        if(resultContainer) resultContainer.addEventListener('click', handleCopy);

        // --- Sự kiện cho tra cứu XUÔI ---
        if(provinceSelectEl) provinceSelectEl.addEventListener('choice', (event) => {
            resetChoice(districtChoices, t('oldDistrictPlaceholder'));
            resetChoice(communeChoices, t('oldCommunePlaceholder'));
            lookupBtn.disabled = true;
            const provinceCode = event.detail.value;
            if (!provinceCode) return;
            districtChoices.enable();
            const selectedProvince = window.allProvincesData.find(p => p.code == provinceCode);
            if (selectedProvince && selectedProvince.districts) {
                updateChoices(districtChoices, t('oldDistrictPlaceholder'), selectedProvince.districts);
            }
        });
        if(districtSelectEl) districtSelectEl.addEventListener('choice', (event) => {
            resetChoice(communeChoices, t('oldCommunePlaceholder'));
            lookupBtn.disabled = true;
            const districtCode = event.detail.value;
            const provinceCode = provinceChoices.getValue(true);
            if (!districtCode || !provinceCode) return;
            communeChoices.enable();
            const selectedProvince = window.allProvincesData.find(p => p.code == provinceCode);
            const selectedDistrict = selectedProvince?.districts.find(d => d.code == districtCode);
            if (selectedDistrict && selectedDistrict.wards) {
                updateChoices(communeChoices, t('oldCommunePlaceholder'), selectedDistrict.wards);
            }
        });
        if(communeSelectEl) communeSelectEl.addEventListener('choice', (event) => {
            lookupBtn.disabled = !event.detail.value;
        });

        // --- Sự kiện cho tra cứu NGƯỢC ---
        if(newProvinceSelectEl) newProvinceSelectEl.addEventListener('choice', async (event) => {
            const provinceCode = event.detail.value;
            if (!provinceCode) return;
            resetChoice(newCommuneChoices, t('newCommuneLoading'));
            lookupBtn.disabled = true;
            try {
                const response = await fetch(`/api/get-new-wards?province_code=${provinceCode}`);
                if(!response.ok) throw new Error(t('newCommuneError'));
                let data = await response.json();

                const localizedData = data.map(ward => ({
                    ...ward,
                    name: localize(ward.name, ward.en_name)
                }));

                updateChoices(newCommuneChoices, t('newCommunePlaceholder'), localizedData, 'ward_code', 'name');
                newCommuneChoices.enable();
            } catch (error) { /* ... */ }
        });

        if(newCommuneSelectEl) newCommuneSelectEl.addEventListener('choice', (event) => {
            lookupBtn.disabled = !event.detail.value;
        });
    }

    // ================================================================
    // ===  LOGIC TRA CỨU CHÍNH - ĐÃ CẬP NHẬT HIỂN THỊ CODE         ===
    // ================================================================
    async function handleForwardLookup() {
        const selectedProvince = provinceChoices.getValue(true);
        const selectedDistrict = districtChoices.getValue(true);
        const selectedCommune = communeChoices.getValue(true);

        if (!selectedProvince || !selectedDistrict || !selectedCommune) {
            alert(t('alertSelectOldCommune', 'Vui lòng chọn đầy đủ địa chỉ cũ.'));
            return;
        }

        const oldWardCode = selectedCommune;
        const fullOldAddress = `${communeChoices.getValue().label}, ${districtChoices.getValue().label}, ${provinceChoices.getValue().label}`;
        const oldCodes = `${selectedCommune}, ${selectedDistrict}, ${selectedProvince}`;

        // --- THAY ĐỔI 1: Hiển thị địa chỉ cũ và mã cũ ngay lập tức ---
        let oldAddressHtml = `
            <div class="address-line"><p><span class="label">${t('oldAddressLabel', 'Địa chỉ cũ:')}</span> ${fullOldAddress}</p></div>
            <div class="address-codes"><span class="label">Old Code:</span> ${oldCodes}</div>`;
        oldAddressDisplay.innerHTML = oldAddressHtml;
        newAddressDisplay.innerHTML = `<p>${t('lookingUp', 'Đang tra cứu...')}</p>`;
        resultContainer.classList.remove('hidden');

        try {
           const response = await fetch(`/api/lookup-forward?code=${oldWardCode}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Server error');

            if (data.changed === false) {
                newAddressDisplay.innerHTML = `<p class="no-change">${t('noChangeMessage')}</p>`;
            } else {
                const newWardName = localize(data.new_ward_name, data.new_ward_en_name);
                const newProvinceName = localize(data.new_province_name, data.new_province_en_name);
                const newAddressForDisplay = `${newWardName}, ${newProvinceName}`;
                // ... (hiển thị kết quả)
            }
        } catch (error) { /* ... */ }
    }

    async function handleReverseLookup() {
        const selectedNewProvince = newProvinceChoices.getValue(true);
        const selectedNewCommune = newCommuneChoices.getValue(true);

        if (!selectedNewProvince || !selectedNewCommune) {
             alert(t('alertSelectNewCommune', 'Vui lòng chọn đầy đủ địa chỉ mới.'));
            return;
        }

        const newWardCode = selectedNewCommune;
        const fullNewAddress = `${newCommuneChoices.getValue().label}, ${newProvinceChoices.getValue().label}`;

        // Chỉ hiển thị loading ban đầu
        oldAddressDisplay.innerHTML = '';
        newAddressDisplay.innerHTML = `<p>${t('lookingUp', 'Đang tra cứu...')}</p>`;
        resultContainer.classList.remove('hidden');

        try {
            const response = await fetch(`/api/lookup-reverse?code=${newWardCode}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Server error');

            if (data.length > 0) {
                 const oldUnitsFullAddresses = data.map(record => {
                    const ward = localize(record.old_ward_name, record.old_ward_en_name);
                    const district = localize(record.old_district_name, record.old_district_en_name);
                    const province = localize(record.old_province_name, record.old_province_en_name);
                    return `<li>${ward}, ${district}, ${province}</li>`;
                }).join('');
                // ... (hiển thị kết quả)
            } else {
                // ...
            }
        } catch (error) {/* ... */}
    }

    // === HÀM PHỤ TRỢ KHÁC ===
    function handleCopy(event) {
        const button = event.target.closest('.copy-btn');
        if (!button) return;
        const textToCopy = button.dataset.copyText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            button.innerHTML = copiedIconSvg;
            button.classList.add('copied');
            button.disabled = true;
            setTimeout(() => {
                button.innerHTML = copyIconSvg;
                button.classList.remove('copied');
                button.disabled = false;
            }, 2000);
        }).catch(err => { console.error('Lỗi khi copy: ', err); });
    }

    async function fetchRandomImage() {
        if (!mysteryBox || !spinner) return;
        spinner.classList.remove('hidden');
        mysteryBox.classList.add('loading-state');
        const oldImg = mysteryBox.querySelector('img');
        if (oldImg) oldImg.style.opacity = '0.3';

        const apiUrl = `https://api.unsplash.com/photos/random?client_id=${UNSPLASH_ACCESS_KEY}&query=vietnam&orientation=portrait`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Unsplash API error');
            const data = await response.json();
            const newImage = new Image();
            newImage.src = data.urls.regular;
            newImage.alt = data.alt_description || "Random image from Unsplash";
            newImage.style.opacity = '0';
            newImage.onload = () => {
                mysteryBox.innerHTML = '';
                mysteryBox.appendChild(newImage);
                setTimeout(() => { newImage.style.opacity = '1'; }, 50);
                mysteryBox.classList.remove('loading-state');
            };
            newImage.onerror = () => { throw new Error("Could not load image file."); }
        } catch (error) {
            console.error("Error fetching image:", error);
            mysteryBox.innerHTML = `<p style="color: red; font-size: 0.9em;">Could not load image.</p>`;
            mysteryBox.classList.remove('loading-state');
        }
    }

    // --- KHỞI CHẠY ỨNG DỤNG---
    initialize();
});