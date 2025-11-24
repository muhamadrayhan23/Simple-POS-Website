
// FUNGSI UTILITAS
// Ambil data dari localStorage
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

// Simpan data ke localStorage
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Format angka ke format Rupiah
function formatRupiah(angka) {
    return "Rp" + angka.toLocaleString("id-ID");
}

// NAVIGASI HALAMAN
function showPage(page) {
    document.querySelectorAll("section").forEach((sec) => sec.classList.add("hidden"));
    document.getElementById(`page-${page}`).classList.remove("hidden");

    // Highlight menu aktif
    document.querySelectorAll(".menu-item").forEach((item) => {
        item.classList.remove("bg-blue-100", "text-blue-600");
    });
    document.getElementById(`menu-${page}`).classList.add("bg-blue-100", "text-blue-600");

    // Render ulang data
    if (page === "pos") renderProducts();
    if (page === "report") renderTransactions();
}

// RENDER PRODUK
function renderProducts() {
    const container = document.getElementById("productList");
    const products = getData("products");

    container.innerHTML = products.length
        ? products
            .map(
                (p) => `
      <div class="bg-white rounded-lg shadow p-3 flex flex-col justify-between hover:shadow-lg transition relative">
        <img src="${p.image}" alt="${p.name}" class="w-full h-50 object-cover mb-3 rounded">
        <h3 class="text-sm font-semibold">${p.name}</h3>
        <p class="text-gray-600">${formatRupiah(p.price)}</p>

        ${p.stock > 0
                        ? `<span class="text-xs text-green-600">Stok: ${p.stock}</span>`
                        : `<span class="text-xs text-red-600 font-semibold">Stok Habis</span>`
                    }

        <div class="flex gap-2 mt-3">
          <button 
            onclick="addToCart(${p.id})"
            class="flex-1 bg-blue-600 text-white py-1 rounded hover:bg-blue-700 ${p.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""}"
            ${p.stock <= 0 ? "disabled" : ""}>
            Tambah ke Keranjang
          </button>

          <button 
            onclick="deleteProduct(${p.id})"
            class="bg-red-600 text-white px-3 rounded hover:bg-red-700">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>`
            )
            .join("")
        : `<p class="col-span-3 text-center text-gray-500">Tidak ada Produk!</p>`;
}

// TAMBAH PRODUK
document.getElementById("addProductForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value);
    const stock = parseInt(document.getElementById("productStock").value);
    const imageFile = document.getElementById("productImage").files[0];

    if (!imageFile) return alert("Silakan pilih gambar produk!");

    const reader = new FileReader();
    reader.onload = function (event) {
        const products = getData("products");

        const newProduct = {
            id: Date.now(),
            name,
            price,
            stock,
            image: event.target.result, // Simpan gambar base64
        };

        products.push(newProduct);
        saveData("products", products);
        alert("Produk berhasil ditambahkan!");
        document.getElementById("addProductForm").reset();
        renderProducts();
    };
    reader.readAsDataURL(imageFile);
});

// HAPUS PRODUK
function deleteProduct(id) {
    const products = getData("products").filter((p) => p.id !== id);
    saveData("products", products);
    renderProducts();
    alert("Produk berhasil dihapus!");
}

//  FUNGSI KERANJANG
function renderCart() {
    const cart = getData("cart");
    const cartContainer = document.getElementById("cartItems");
    const subtotalEl = document.getElementById("subtotal");
    const discountEl = document.getElementById("discount");
    const totalEl = document.getElementById("total");

    if (!cartContainer) return;

    // Render item  ke keranjang
    cartContainer.innerHTML = cart.length
        ? cart
            .map(
                (item) => `
      <li class="flex justify-between items-center border-b pb-2">
        <div>
          <p class="font-semibold">${item.name}</p>
          <p class="text-sm text-gray-600">${formatRupiah(item.price)} x ${item.qty}</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="changeQty(${item.id}, 'minus')" class="bg-gray-200 px-2 rounded hover:bg-gray-300">-</button>
          <span class="font-semibold">${item.qty}</span>
          <button onclick="changeQty(${item.id}, 'plus')" class="bg-gray-200 px-2 rounded hover:bg-gray-300">+</button>
          <button onclick="removeFromCart(${item.id})" class="bg-red-600 text-white px-2 rounded hover:bg-red-700">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </li>`
            )
            .join("")
        : `<p class="text-gray-500 text-center">Keranjang kosong!</p>`;

    // Hitung subtotal dan total item
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

    // Diskon 20% jika total item 2 atau lebih
    const discountRate = totalQty >= 2 ? 0.2 : 0;
    const discount = subtotal * discountRate;
    const total = subtotal - discount;

    //Tampilkan hasil perhitungan
    subtotalEl.textContent = formatRupiah(subtotal);
    discountEl.textContent = formatRupiah(discount);
    totalEl.textContent = formatRupiah(total);
}

// Tambah produk ke keranjang
function addToCart(id) {
    const products = getData("products");
    const cart = getData("cart");

    const product = products.find((p) => p.id === id);
    if (!product || product.stock <= 0) {
        alert("Stok produk habis!");
        return;
    }

    // Cari produk di keranjang
    const existing = cart.find((c) => c.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            qty: 1,
        });
    }

    // Kurangi stok di produk
    product.stock--;

    // Simpan ke localStorage
    saveData("products", products);
    saveData("cart", cart);

    renderProducts();
    renderCart();
}

// Ubah jumlah produk di keranjang (+ atau -)
function changeQty(id, action) {
    const products = getData("products");
    const cart = getData("cart");

    const item = cart.find((c) => c.id === id);
    const product = products.find((p) => p.id === id);

    if (!item || !product) return;

    if (action === "plus") {
        if (product.stock <= 0) {
            alert("Stok habis, tidak bisa menambah lagi!");
            return;
        }
        item.qty++;
        product.stock--;
    } else if (action === "minus") {
        item.qty--;
        product.stock++;
        if (item.qty <= 0) {
            // Hapus jika qty 0
            const index = cart.findIndex((c) => c.id === id);
            cart.splice(index, 1);
        }
    }

    saveData("products", products);
    saveData("cart", cart);

    renderProducts();
    renderCart();
}

// Hapus produk dari keranjang
function removeFromCart(id) {
    const products = getData("products");
    const cart = getData("cart");

    const item = cart.find((c) => c.id === id);
    const product = products.find((p) => p.id === id);

    if (item && product) {
        // Kembalikan stok sesuai jumlah di keranjang
        product.stock += item.qty;
    }

    const newCart = cart.filter((c) => c.id !== id);

    saveData("products", products);
    saveData("cart", newCart);

    renderProducts();
    renderCart();
}

// FITUR PENCARIAN PRODUK
const searchInput = document.getElementById("searchProduct");

// Event: Saat user mengetik di kotak pencarian
if (searchInput) {
    searchInput.addEventListener("input", function () {
        const keyword = this.value.toLowerCase();
        const products = getData("products");

        // Filter produk berdasarkan nama
        const filtered = products.filter((p) =>
            p.name.toLowerCase().includes(keyword)
        );

        // Render hasil pencarian
        renderFilteredProducts(filtered);
    });
}

// Render produk hasil pencarian 
function renderFilteredProducts(list) {
    const container = document.getElementById("productList");

    container.innerHTML = list.length
        ? list
            .map(
                (p) => `
      <div class="bg-white rounded-lg shadow p-3 flex flex-col justify-between hover:shadow-lg transition relative">
        <img src="${p.image}" alt="${p.name}" class="w-full h-50 object-cover mb-3 rounded">
        <h3 class="text-sm font-semibold">${p.name}</h3>
        <p class="text-gray-600">${formatRupiah(p.price)}</p>

        ${p.stock > 0
                        ? `<span class="text-xs text-green-600">Stok: ${p.stock}</span>`
                        : `<span class="text-xs text-red-600 font-semibold">Stok Habis</span>`
                    }

        <div class="flex gap-2 mt-3">
          <button 
            onclick="addToCart(${p.id})"
            class="flex-1 bg-blue-600 text-white py-1 rounded hover:bg-blue-700 ${p.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""}"
            ${p.stock <= 0 ? "disabled" : ""}>
            Tambah ke Keranjang
          </button>

          <button 
            onclick="deleteProduct(${p.id})"
            class="bg-red-600 text-white px-3 rounded hover:bg-red-700">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>`
            )
            .join("")
        : `<p class="col-span-3 text-center text-gray-500">Produk tidak ditemukan!</p>`;
}


// FUNGSI CHECKOUT
document.getElementById("checkoutBtn").addEventListener("click", () => {
    const cart = getData("cart");

    if (!cart || cart.length === 0) {
        alert("Keranjang kosong!");
        return;
    }

    // Hitung subtotal
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    // Hitung total Qty
    const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);

    // Diskon 20% jika total item >= 2
    const discountRate = totalQty >= 2 ? 0.2 : 0;
    const discount = subtotal * discountRate;

    // Total setelah diskon
    const total = subtotal - discount;

    // Ambil daftar transaksi sebelumnya
    const transactions = getData("transactions");

    // ID unik: TX-001, TX-002, dst.
    const nextNum = String(transactions.length + 1).padStart(3, "0");
    const id = `TX-${nextNum}`;

    // Simpan data transaksi
    const newTransaction = {
        id, date: new Date().toLocaleString("id-ID"), items:
            cart.map(item =>
            ({
                id: item.id,
                date: item.date,
                name: item.name,
                price: item.price,
                qty: item.qty
            })),
        subtotal,
        discount,
        total
    };

    // Masukkan ke array transaksi
    transactions.push(newTransaction);
    saveData("transactions", transactions);

    // Kosongkan keranjang
    saveData("cart", []);
    renderCart();

    alert(`Checkout selesai!\nNomor Transaksi: ${id}`);
});

// RENDER LAPORAN TRANSAKSI
function renderTransactions() {
    const container = document.getElementById("transactionList");
    const transactions = getData("transactions");

    container.innerHTML = "";

    if (transactions.length === 0) {
        container.innerHTML = `
            <p class="text-gray-500">Belum ada transaksi.</p>
        `;
        return;
    }

    transactions.forEach(tx => {

        const itemsHTML = tx.items.map(i => `
            <div class="flex justify-between text-sm">
                <span>${i.name} (x${i.qty})</span>
                <span>${formatRupiah(i.price)} x ${i.qty}</span>
            </div>
        `).join("");

        container.innerHTML += `
            <div class="p-4 bg-white shadow rounded-lg border">
                <div class="flex justify-between font-bold text-lg mb-2">
                    <span>${tx.id}</span>
                    <span>${tx.date}</span>
                </div>

                <div class="mb-2">${itemsHTML}</div>

                 <div class="flex justify-between text-green-600">
                    <span>Subtotal</span>
                    <span>-${formatRupiah(tx.subtotal)}</span>
                </div>

                <div class="flex justify-between text-green-600">
                    <span>Diskon 20%</span>
                    <span>-${formatRupiah(tx.discount)}</span>
                </div>

                <div class="flex justify-between font-bold text-blue-600 text-lg mt-2">
                    <span>Total</span>
                    <span>${formatRupiah(tx.total)}</span>
                </div>
            </div>
        `;
    });
}

// INISIALISASI HALAMAN 
renderProducts();
renderCart();
