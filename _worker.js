// Util Functions
function escapeHtml(text) {
	return (text || '').replace(/[&<>"]'/g, m => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
	})[m]);
}
function simpleEncode(domain, slug, length = 9) {
	const seed = `${domain}|${slug}`;
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash |= 0;
	}
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	let value = Math.abs(hash);
	while (result.length < length) {
		result += chars[value % chars.length];
		value = Math.floor(value / chars.length);
	}
	return result;
}
function detectLang(domain, slug, idSuffix) {
	const langs = ['ko', 'en', 'ja', 'fr', 'es', 'pt', 'it', 'th', 'ar', 'pl', 'de', 'nl', 'ru'];
	for (const lang of langs) {
		if (generateId(domain, lang, slug, 5) === idSuffix) return lang;
	}
	return null;
}
function generateId(domain, lang, slug, length = 5) {
	const seed = `${domain}|${lang}|${slug}`;
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash << 5) - hash + seed.charCodeAt(i);
		hash |= 0;
	}
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	let value = Math.abs(hash);
	while (result.length < length) {
		result += chars[value % chars.length];
		value = Math.floor(value / chars.length);
	}
	return result;
}
const generateProductHtml = (data, lang, url, affUrl, slug, outboundUrl = '', recommendedHtml = '') => {
	const title = escapeHtml(data.document_title || slug);
	const description = escapeHtml(data.newdescription || '');
	const productName = escapeHtml(data.titlesingle);
	const imageUrls = data.product_small_image_urls || [];
	const randomSlug = escapeHtml(data.slugAcak);
	const randomIdSuffix = generateId(url.hostname, lang, data.slugAcak, 5);
	const randomInternalUrl = `/${lang ? lang + '/' : ''}${randomSlug}-${randomIdSuffix}`;
	const randomSlugText = randomSlug.replace(/-/g, ' ');
	const firstCategoryRaw = data.first_level_category_name || '';
	const secondCategoryRaw = data.second_level_category_name || '';
	const firstCategory = escapeHtml(firstCategoryRaw);
	const secondCategory = escapeHtml(secondCategoryRaw);
	const firstSlug = firstCategoryRaw.trim().replace(/\s+/g, '-');
	const secondSlug = secondCategoryRaw.trim().replace(/\s+/g, '-');
	
	const productNameEncoded = encodeURIComponent(data.titlesingle);
	const aliTargetUrl = `https://www.aliexpress.com/wholesale?SearchText=${productNameEncoded}`;
	const aliTargetUrlEncoded = encodeURIComponent(aliTargetUrl);
	const aliAffUrl = `https://s.click.aliexpress.com/deep_link.htm?aff_short_key=_DkhJKeT&dl_target_url=${aliTargetUrlEncoded}`;
	const i18nSentence = {
	  en: name => `Search <strong>${name}</strong> on`,
	  ko: name => `<strong>${name}</strong> 검색:`,
	  ja: name => `<strong>${name}</strong> を検索:`,
	  de: name => `<strong>${name}</strong> suchen auf`,
	  fr: name => `Rechercher <strong>${name}</strong> sur`,
	  es: name => `Buscar <strong>${name}</strong> en`,
	  pt: name => `Pesquisar <strong>${name}</strong> em`,
	  it: name => `Cerca <strong>${name}</strong> su`,
	  nl: name => `Zoeken <strong>${name}</strong> op`,
	  ru: name => `Искать <strong>${name}</strong> в`,
	  pl: name => `Szukaj <strong>${name}</strong> w`,
	  th: name => `ค้นหา <strong>${name}</strong> ใน`,
	  ar: name => `ابحث عن <strong>${name}</strong> في`
	};
	
	// i18n kata "or"
	const i18nOr = {
	  en: "or",
	  ko: "또는",
	  ja: "または",
	  de: "oder",
	  fr: "ou",
	  es: "o",
	  pt: "ou",
	  it: "o",
	  nl: "of",
	  ru: "или",
	  pl: "lub",
	  th: "หรือ",
	  ar: "أو"
	};
	
	// ambil sesuai lang
	const sentence = (i18nSentence[lang] || i18nSentence.en)(productName);
	const wordOr  = i18nOr[lang] || i18nOr.en;
	
	const priceOriginalFormatted = escapeHtml(data.target_original_price_formatted);
	const priceFormatted = escapeHtml(data.target_sale_price_formatted);
	let priceHtml = "";
	if (priceOriginalFormatted !== priceFormatted) {
	  // Ada diskon
	  priceHtml = `
	    <div class="price-box">
	      <span class="price-label"></span>
	      <span class="price-original">${priceOriginalFormatted.replace(/^US\\s*/, '')}</span>
	      <span class="price-value">${priceFormatted.replace(/^US\\s*/, '')}</span>
	    </div>
	  `;
	} else {
	  // Tidak ada diskon
	  priceHtml = `
	    <div class="price-box">
	      <span class="price-label"></span>
	      <span class="price-value">${priceFormatted.replace(/^US\\s*/, '')}</span>
	    </div>
	  `;
	}
	const categories = {
	  first_level_category_name: firstCategory,
	  second_level_category_name: secondCategory,
	  first_level_category_slug: firstSlug,
	  second_level_category_slug: secondSlug
	};
	const dir = data.dir || 'ltr';
	
	const buyButtonLabels = {
		en: 'Detail Product',
		ko: '제품 상세보기',
		ja: '商品詳細',
		de: 'Produktdetails',
		pl: 'Szczegóły produktu',
		th: 'ดูรายละเอียดสินค้า',
		es: 'Detalles del producto',
		pt: 'Detalhes do produto',
		ar: 'تفاصيل المنتج',
		it: 'Dettagli del prodotto',
		fr: 'Détails du produit',
		nl: 'Productdetails',
		ru: 'Детали продукта'
	};
	const buyLabel = buyButtonLabels[lang] || buyButtonLabels['en'];
	const cartLabels = {
	en: 'Add to Cart',
	ko: '장바구니에 담기',
	ja: 'カートに追加',
	de: 'In den Warenkorb',
	pl: 'Dodaj do koszyka',
	th: 'หยิบใส่ตะกร้า',
	es: 'Añadir al carrito',
	pt: 'Adicionar ao carrinho',
	ar: 'أضف إلى السلة',
	it: 'Aggiungi al carrello',
	fr: 'Ajouter au panier',
	nl: 'Toevoegen aan winkelwagen',
	ru: 'Добавить в корзину'
	};
	
	const cartLabel = cartLabels[lang] || cartLabels['en'];
	
	const relatedTitles = {
		    ko: '관련 상품',
		    fr: 'Produits Associés',
		    es: 'Productos Relacionados',
		    pt: 'Produtos Relacionados',
		    it: 'Prodotti Correlati',
		    ja: '関連商品',
		    en: 'Related Products',
		    pl: 'Produkty Powiązane',
		    de: 'Verwandte Produkte',
		    th: 'สินค้าที่เกี่ยวข้อง',
		    ar: 'منتجات ذات صلة',
		    nl: 'Gerelateerde Producten',
		    ru: 'Связанные товары'
		};
	const relatedTitle = relatedTitles[lang] || relatedTitles['en'];
	let extraOutboundLink = '';
	    if (outboundUrl) {
	        extraOutboundLink = `
	            <div class="related-link" style="margin-top:1px; display:block;">
	                <a href="${outboundUrl}" target="_blank" style="font-weight:bold; color:#555;">${relatedTitle}</a>
	            </div>`;
	    }
	
	const productJsonLd = {
		"@context": "https://schema.org/",
		"@type": "Product",
		name: data.titlesingle,
		image: imageUrls,
		description: data.newdescription,
		sku: data.productId,
		...(data.lastest_volume > 0 && {
			aggregateRating: {
				"@type": "AggregateRating",
				ratingValue: data.stars,
				reviewCount: data.lastest_volume,
			}
		}),
		offers: {
			"@type": "Offer",
			url: url.href,
			priceCurrency: data.target_currency,
			price: Number(data.target_sale_price),
			availability: "https://schema.org/InStock",
		}
	};

	
	return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="index,follow">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrls[0]}">
<meta property="og:url" content="${url.href}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="estubes.github.io">
<link rel="canonical" href="${url.origin}${url.pathname}${url.search}">
<link rel="icon" type="image/png" href="/favicon.ico"/>
<meta name="theme-color" content="#ffffff" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" as="style" />
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
<link rel="preload" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css" as="style" />
<link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css" media="print" onload="this.media='all'" />
<noscript><link rel="stylesheet" href="https://unicons.iconscout.com/release/v4.0.8/css/line.css"></noscript>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'Poppins',sans-serif}body{font-family:'Poppins',sans-serif;background-color:#f1f1f1;margin:0;padding:20px;display:flex;justify-content:center;padding-top:80px;background:#f9f9f9;transition:padding .3s}}.product-wrapper{max-width:768px;margin:0 auto;padding:1rem;background:#fff;border-radius:12px;box-shadow:0 2px 10px rgb(0 0 0 / .05);box-sizing:border-box}.product-title{font-size:20px;text-align:center;margin-bottom:1rem;color:#111;padding:0 1rem;word-break:break-word}.product-gallery{width:100%;max-width:768px;margin:0 auto;padding:1rem;display:flex;flex-direction:column;align-items:center;background:#fff;border-radius:10px;box-shadow:0 2px 8px rgb(0 0 0 / .05);box-sizing:border-box}.main-image{height:auto;border:1px solid #ccc;border-radius:8px;margin-bottom:16px;box-shadow:0 0 10px rgb(0 0 0 / .1)}.thumbnails{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-bottom:16px;max-width:100%}.thumb{width:72px;height:72px;object-fit:cover;border:2px solid #fff0;border-radius:6px;cursor:pointer;transition:border-color 0.3s,transform 0.2s}.thumb:hover{border-color:#007bff;transform:scale(1.05)}.description{padding:0 1rem;font-size:14px;text-align:center;line-height:1.6;color:#333}.button-group{display:flex;justify-content:center;gap:12px;margin-top:24px}.button-group a{flex:1;max-width:240px;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;font-size:15px;font-weight:600;border-radius:8px;text-decoration:none;transition:all 0.3s ease;box-shadow:0 4px 10px rgb(0 0 0 / .08)}.btn-cart{background-color:#1976d2;color:#fff}.btn-cart:hover{background-color:#125aa0}.btn-buy{background-color:#c62828;color:#fff}.btn-buy:hover{background-color:#b71c1c}.button-group i{font-size:18px}.related-link{margin:20px auto;font-size:14px;color:#374151}.related-link a{display:inline-flex;align-items:center;margin:0 4px;color:#2563eb;text-decoration:none;font-weight:500}.related-link a:hover{text-decoration:underline}.related-link svg{margin-right:4px}.breadcrumb{padding-left:12px;margin-top:8px;margin-bottom:8px;font-size:13px;color:#333}.breadcrumb a{color:#333;text-decoration:none}.breadcrumb a:hover{text-decoration:underline}.price-box{text-align:center;margin:15px 0}.price-label{font-size:20px;color:#222}.price-original{font-size:18px;font-weight:400;color:#888;text-decoration:line-through;margin-right:10px}.price-value{font-size:24px;font-weight:700;color:#e63946}@media (max-width:480px){.thumb{width:64px;height:64px}.product-gallery{padding:.5rem}.description{font-size:13px}.button-link{width:100%;text-align:center}}.recommended-products{margin-top:25px;padding:10px 0}.recommended-products h2{font-size:1.3rem;margin-bottom:15px;font-weight:600;color:#333}.recommended-products .product-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:15px;list-style:none;padding:0;margin:0}.recommended-products .{background:#fff;border:1px solid #eee;border-radius:8px;overflow:hidden;position:relative;transition:transform 0.2s,box-shadow 0.2s;display:flex;flex-direction:column;height:100%}.recommended-products .:hover{translateY(-4px);box-shadow:0 8px 20px rgb(0 0 0 / .08)}.recommended-products . img{width:100%;height:100%;display:block;object-fit:cover}.recommended-products .product-card .img-wrapper{width:140px;height:140px;overflow:hidden;margin:0 auto}.recommended-products .product-card h3{font-size:.9rem;font-weight:500;margin:8px 10px 4px;color:#222;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.recommended-products .price-box{display:flex;justify-content:center;align-items:center;gap:5px;margin:10px 0;font-family:'Roboto',sans-serif;margin-top:auto}.recommended-products .price-final{font-size:1rem;font-weight:600;color:#E53935}.recommended-products .price-original{font-size:.85rem;color:#999;text-decoration:line-through}.recommended-products .discount{position:absolute;top:8px;left:8px;background:#E53935;color:#fff;font-size:.75rem;font-weight:700;padding:2px 6px;border-radius:4px;z-index:2;text-transform:uppercase}@media (max-width:500px){.recommended-products .product-list{grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}.recommended-products .product-card img{width:100%;height:100%;object-fit:cover;display:block;box-shadow:0 0 10px rgb(0 0 0 / .1)}.recommended-products .product-card h3{font-size:.85rem}.recommended-products .price-final{font-size:.9rem}.recommended-products .price-original{font-size:.75rem}.recommended-products .discount{font-size:.65rem;padding:1px 4px}}.breadcrumb-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}.breadcrumb-bar .search-box{flex:1 1 auto;max-width:250px}@media (max-width:600px){.breadcrumb-bar{flex-direction:column;align-items:stretch}.breadcrumb-bar .search-box{max-width:100%}}.nav{position:fixed;top:0;left:0;width:100%;padding:15px 20px;background:#4a98f7;box-shadow:0 4px 10px rgb(0 0 0 / .1);display:flex;align-items:center;justify-content:space-between;z-index:1000;transition:.3s}.menu-icon{font-size:24px;color:#fff;cursor:pointer}.logo{font-size:20px;font-weight:700;color:#fff;text-decoration:none;display:flex;align-items:center;gap:6px;font-family:'Poppins',sans-serif}.logo i{font-size:22px;color:#fd0}.logo span{color:#fd0}.search-box{display:none;position:absolute;top:50%;right:60px;transform:translateY(-50%);background:#fff;border-radius:6px;box-shadow:0 2px 6px rgb(0 0 0 / .15);z-index:1000}.nav.openSearch .search-box{display:block}.search-box input{width:200px;padding:8px 12px;border-radius:6px;border:1px solid #ccc;outline:none}[dir=rtl] .search-box{right:auto;left:60px}[dir=rtl] .search-box input{text-align:right}.nav .search-icon{font-size:24px;color:#fff;cursor:pointer}.sidebar{position:fixed;top:0;left:-300px;width:250px;height:100%;background:#fff;box-shadow:2px 0 6px rgb(0 0 0 / .1);z-index:1100;padding:20px;box-sizing:border-box;transition:left 0.3s ease;overflow-y:auto}.sidebar.open{left:0}.sidebar.active{left:0}.sidebar h3{font-size:16px;font-weight:600;color:#444;margin-bottom:15px;padding-bottom:8px;border-bottom:2px solid #eee;text-transform:uppercase;letter-spacing:.5px}.sidebar .breadcrumbs{display:flex;flex-wrap:wrap;align-items:center;gap:5px;font-size:14px;margin-bottom:20px}.sidebar .breadcrumbs a{color:#333;text-decoration:none}.sidebar .breadcrumbs a:hover{text-decoration:underline}.sidebar .breadcrumbs span{color:#888}.sidebar-close{display:block;text-align:right;font-size:22px;color:#333;cursor:pointer;margin-bottom:20px}@media (max-width:600px){.logo{font-size:16px}.sidebar{width:250px}}.overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgb(0 0 0 / .4);opacity:0;visibility:hidden;transition:opacity 0.3s ease;z-index:1050}.overlay.show{opacity:1;visibility:visible}.product-card-recom .button-group,.product-card-recom .add-to-cart,.product-card-recom .detail-button{display:none!important}
</style>
<script type="application/ld+json">
${JSON.stringify(productJsonLd)}
</script>
<script id="category-json" type="application/json">${JSON.stringify(categories)}</script>
</head>
<body>
<div class="product-wrapper">
<nav class="nav">
    <i class="uil uil-bars menu-icon" id="menuToggle"></i>
	<a href="/" class="logo">
	  <i class="uil uil-shopping-bag"></i> HOME
	</a>
    <div class="search-box" id="searchBox">
        <form id="searchForm" onsubmit="return goSearch()">
            <input type="text" id="q" placeholder="Search...">
        </form>
    </div>
	<i class="uil uil-search search-icon" id="searchIcon"></i>
</nav>

<div class="sidebar" id="sidebar">
    <h3>estubes.github.io</h3>
	<div id="breadcrumbBox" class="breadcrumbs"></div>
</div>

<div class="overlay" id="overlay"></div>

<div class="product-gallery">
	<h1 class="product-title">${productName}</h1>

	<img
	  id="mainImage"
	  src="${imageUrls[0]}_500x500.jpg"
	  srcset="
	    ${imageUrls[0]}_350x350.jpg 350w,
	    ${imageUrls[0]}_500x500.jpg 500w"
	  sizes="(max-width: 480px) 350px, 500px"
	  alt="${productName}" 
	  class="main-image" 
	  fetchpriority="high"
	  width="500"
	  height="500"
	  style="max-width: 100%; height: auto;"
	/>

	<div class="thumbnails">
		${imageUrls.map((url, i) => {
			return `
				<img 
				  src="${url}_100x100.jpg"
				  data-srcset="${url}_350x350.jpg 350w, ${url}_500x500.jpg 500w"
				  data-sizes="(max-width: 480px) 350px, 500px"
				  alt="${productName} ${i + 1}" 
				  class="thumb ${i === 0 ? 'active' : ''}" 
				  loading="lazy"
				  onclick="const main=document.getElementById('mainImage');
				    main.src=this.dataset.full+'_500x500.jpg';
				    main.srcset=this.dataset.srcset;
				    main.sizes=this.dataset.sizes;
				    document.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));
				    this.classList.add('active');"
				/>
			`;
		}).join('')}
	</div>
</div>

${priceHtml}
<p class="description" dir="${dir}">${description}</p>

<div class="button-group">
  <a href="#" 
     class="btn-cart" 
     rel="nofollow noopener" 
     data-aff-url="${affUrl}">
    <i class="uil uil-shopping-cart"></i> ${cartLabel}
  </a>

  <a href="#" 
     class="btn-buy" 
     rel="nofollow noopener" 
     data-aff-url="${affUrl}">
    <i class="uil uil-info-circle"></i> ${buyLabel}
  </a>
</div>
${recommendedHtml}

<div style="text-align:center;">
  <div class="related-link">
    ${sentence}

    <a href="https://www.google.com/search?q=${productNameEncoded}" 
       rel="nofollow noopener" target="_blank" class="icon-link">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="16" height="16">
        <path fill="#4285F4" d="M24 9.5c3.8 0 6.8 1.6 8.4 2.9l6.2-6.2C34.2 2.6 29.6.5 24 .5 14.8.5 7.2 6.8 4.3 15.4l7.4 5.7C13 13.7 18.1 9.5 24 9.5z"/>
        <path fill="#34A853" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8h12.7c-.6 3.2-2.4 5.9-5 7.7l7.8 6c4.6-4.3 7-10.6 7-17.6z"/>
        <path fill="#FBBC05" d="M11.7 28.6c-1-3-1-6.3 0-9.3l-7.4-5.7c-3.1 6.2-3.1 13.6 0 19.8l7.4-5.7z"/>
        <path fill="#EA4335" d="M24 47c6.5 0 12-2.1 16-5.8l-7.8-6c-2.2 1.5-5 2.3-8.2 2.3-5.9 0-11-4.2-12.8-9.9l-7.4 5.7C7.2 41.2 14.8 47 24 47z"/>
      </svg>
      <span>Google</span>
    </a> 

    <span style="margin:0 4px;">${wordOr}</span> 

    <a href="${aliAffUrl}" rel="nofollow sponsored noopener" target="_blank" class="icon-link">
      <img src="/Aliexpress.png" alt="" width="16" height="16" style="vertical-align:middle;">
      <span>AliExpress</span>
    </a>
  </div>
</div>

</div>

<div style="display:none;">
<img src="//sstatic1.histats.com/0.gif?4965433&101" alt="histats" width="1" height="1">
</div>

<script>
function _0x355e(){const _0x3754b7=['612144MsmVos','3032448ppBKiV','getAttribute','href','79375spHTcg','45040lEKyee','12504176pWyeJR','DOMContentLoaded','location','85SaYoNM','9912007FvnkuE','4519629iQlKWY','6IFkeWX','.button-group\x20a'];_0x355e=function(){return _0x3754b7;};return _0x355e();}const _0x5b1f45=_0x2589;function _0x2589(_0x24261a,_0x7f89bf){const _0x355edc=_0x355e();return _0x2589=function(_0x258941,_0x480c25){_0x258941=_0x258941-0xec;let _0x515bf0=_0x355edc[_0x258941];return _0x515bf0;},_0x2589(_0x24261a,_0x7f89bf);}(function(_0x153f0c,_0x409bd4){const _0x619c8b=_0x2589,_0x20b8f1=_0x153f0c();while(!![]){try{const _0x23a67a=-parseInt(_0x619c8b(0xef))/0x1+-parseInt(_0x619c8b(0xec))/0x2+-parseInt(_0x619c8b(0xf9))/0x3+-parseInt(_0x619c8b(0xf0))/0x4*(-parseInt(_0x619c8b(0xf4))/0x5)+parseInt(_0x619c8b(0xf7))/0x6*(parseInt(_0x619c8b(0xf5))/0x7)+parseInt(_0x619c8b(0xf1))/0x8+-parseInt(_0x619c8b(0xf6))/0x9;if(_0x23a67a===_0x409bd4)break;else _0x20b8f1['push'](_0x20b8f1['shift']());}catch(_0x1d0934){_0x20b8f1['push'](_0x20b8f1['shift']());}}}(_0x355e,0xd4107),document['addEventListener'](_0x5b1f45(0xf2),function(){const _0x4a988a=_0x5b1f45,_0x4f0991=document['querySelectorAll'](_0x4a988a(0xf8));_0x4f0991['forEach'](_0x4d65fc=>{_0x4d65fc['addEventListener']('click',function(_0x1aee19){const _0x3a2089=_0x2589;_0x1aee19['preventDefault']();const _0x24f89e=this[_0x3a2089(0xed)]('data-aff-url');_0x24f89e&&(window[_0x3a2089(0xf3)][_0x3a2089(0xee)]=_0x24f89e);});});}));
</script>

<script>
function _0x375f(){const _0x16f3f4=['10InpkYa','getElementById','classList','open','14895TsnIJF','show','3248619POyseP','1118804fzYdUs','8229ENaaEi','menuToggle','openSearch','8MLSjZm','7265VexcfG','36QuiexL','sidebar','6380fWMlDc','click','addEventListener','overlay','remove','7826154JRNaLD','1804pytvgJ','toggle','.nav','querySelector','1245966PNajgH'];_0x375f=function(){return _0x16f3f4;};return _0x375f();}function _0x2caf(_0x236b0a,_0x46a9f6){const _0x375f0a=_0x375f();return _0x2caf=function(_0x2caf21,_0x17a788){_0x2caf21=_0x2caf21-0x166;let _0x9df314=_0x375f0a[_0x2caf21];return _0x9df314;},_0x2caf(_0x236b0a,_0x46a9f6);}(function(_0x58a193,_0x9eeeaf){const _0x53de22=_0x2caf,_0x425b3e=_0x58a193();while(!![]){try{const _0x3a1e7f=parseInt(_0x53de22(0x17f))/0x1+-parseInt(_0x53de22(0x178))/0x2*(parseInt(_0x53de22(0x166))/0x3)+-parseInt(_0x53de22(0x173))/0x4*(-parseInt(_0x53de22(0x16a))/0x5)+-parseInt(_0x53de22(0x177))/0x6+parseInt(_0x53de22(0x172))/0x7*(-parseInt(_0x53de22(0x169))/0x8)+parseInt(_0x53de22(0x17c))/0x9*(parseInt(_0x53de22(0x16d))/0xa)+-parseInt(_0x53de22(0x17e))/0xb*(parseInt(_0x53de22(0x16b))/0xc);if(_0x3a1e7f===_0x9eeeaf)break;else _0x425b3e['push'](_0x425b3e['shift']());}catch(_0x32ac4){_0x425b3e['push'](_0x425b3e['shift']());}}}(_0x375f,0x939c4),document['addEventListener']('DOMContentLoaded',function(){const _0xb71e2c=_0x2caf,_0x53a236=document[_0xb71e2c(0x179)](_0xb71e2c(0x167)),_0x229ac6=document[_0xb71e2c(0x179)](_0xb71e2c(0x16c)),_0x4324d0=document[_0xb71e2c(0x179)](_0xb71e2c(0x170)),_0x25afc7=document[_0xb71e2c(0x179)]('searchIcon'),_0x146fb3=document[_0xb71e2c(0x176)](_0xb71e2c(0x175));_0x53a236[_0xb71e2c(0x16f)]('click',function(){const _0x589e13=_0xb71e2c;_0x229ac6['classList'][_0x589e13(0x174)](_0x589e13(0x17b)),_0x4324d0[_0x589e13(0x17a)]['toggle'](_0x589e13(0x17d));}),_0x4324d0[_0xb71e2c(0x16f)](_0xb71e2c(0x16e),function(){const _0x414c73=_0xb71e2c;_0x229ac6['classList'][_0x414c73(0x171)](_0x414c73(0x17b)),this['classList'][_0x414c73(0x171)](_0x414c73(0x17d));}),_0x25afc7[_0xb71e2c(0x16f)](_0xb71e2c(0x16e),function(){const _0x55581e=_0xb71e2c;_0x146fb3[_0x55581e(0x17a)][_0x55581e(0x174)](_0x55581e(0x168));});}));
</script>

<script>
function _0x4765(_0x43b6bc,_0x467a50){const _0x70ea17=_0x70ea();return _0x4765=function(_0x47650a,_0x44de75){_0x47650a=_0x47650a-0x1ca;let _0x524262=_0x70ea17[_0x47650a];return _0x524262;},_0x4765(_0x43b6bc,_0x467a50);}function _0x70ea(){const _0x16184c=['location','href','submit','12293388RHCNoI','trim','5SnhQpe','preventDefault','searchForm','https://www.aliexpress.com/wholesale?SearchText=','getElementById','664129hdceMg','&dl_target_url=','47901NQjThU','4337468sQyqdH','7173600rrBfLI','965595tHpxcZ','618bRVLHn','1453850cOpaup'];_0x70ea=function(){return _0x16184c;};return _0x70ea();}const _0x4377e0=_0x4765;(function(_0x3b252f,_0x13bc44){const _0xf9b25=_0x4765,_0x2d159b=_0x3b252f();while(!![]){try{const _0x54a4b7=-parseInt(_0xf9b25(0x1cc))/0x1+-parseInt(_0xf9b25(0x1d3))/0x2+-parseInt(_0xf9b25(0x1d1))/0x3+-parseInt(_0xf9b25(0x1cf))/0x4*(-parseInt(_0xf9b25(0x1d9))/0x5)+parseInt(_0xf9b25(0x1d2))/0x6*(parseInt(_0xf9b25(0x1ce))/0x7)+-parseInt(_0xf9b25(0x1d0))/0x8+parseInt(_0xf9b25(0x1d7))/0x9;if(_0x54a4b7===_0x13bc44)break;else _0x2d159b['push'](_0x2d159b['shift']());}catch(_0x4b15f4){_0x2d159b['push'](_0x2d159b['shift']());}}}(_0x70ea,0x852e5));const AFF__KEY='_DkhJKeT',BASE_SEARCH=_0x4377e0(0x1ca);document[_0x4377e0(0x1cb)](_0x4377e0(0x1db))['addEventListener'](_0x4377e0(0x1d6),function(_0x30ff17){const _0x36afd1=_0x4377e0;_0x30ff17[_0x36afd1(0x1da)]();let _0x142c4a=document[_0x36afd1(0x1cb)]('q')['value'][_0x36afd1(0x1d8)]();if(_0x142c4a){let _0x166555=BASE_SEARCH+encodeURIComponent(_0x142c4a),_0x581518='https://s.click.aliexpress.com/deep_link.htm?aff_short_key='+AFF__KEY+_0x36afd1(0x1cd)+encodeURIComponent(_0x166555);window[_0x36afd1(0x1d4)][_0x36afd1(0x1d5)]=_0x581518;}});
</script>

<script>
const _0x52ef99=_0x385f;function _0x4d09(){const _0x1b5b4a=['Populair','หน้าหลัก','Inicio','4387614wTpqBb','60faATML','ยอดนิยม','11810151DenYrm','1057372AqQjfZ','8264311ECdcOU','Popular','Populares','ホーム','HOME','Popularne','49RjVKIs','Home','3112200lDGfjb','Accueil','الأكثر\x20شهرة','Популярное','33918ZRGLAJ','Startseite','Beliebt','112ZqmNNC','10MLoefs','Главная','25vHBNxD','الرئيسية','Início','815255gxOfDq','Strona\x20główna'];_0x4d09=function(){return _0x1b5b4a;};return _0x4d09();}(function(_0x5bc528,_0x4e5428){const _0x5a00fe=_0x385f,_0x2a43b0=_0x5bc528();while(!![]){try{const _0x3520a2=-parseInt(_0x5a00fe(0x15d))/0x1*(parseInt(_0x5a00fe(0x163))/0x2)+-parseInt(_0x5a00fe(0x15f))/0x3+-parseInt(_0x5a00fe(0x156))/0x4*(parseInt(_0x5a00fe(0x14a))/0x5)+parseInt(_0x5a00fe(0x152))/0x6+-parseInt(_0x5a00fe(0x14d))/0x7*(parseInt(_0x5a00fe(0x166))/0x8)+-parseInt(_0x5a00fe(0x155))/0x9*(-parseInt(_0x5a00fe(0x167))/0xa)+-parseInt(_0x5a00fe(0x157))/0xb*(-parseInt(_0x5a00fe(0x153))/0xc);if(_0x3520a2===_0x4e5428)break;else _0x2a43b0['push'](_0x2a43b0['shift']());}catch(_0x28efd7){_0x2a43b0['push'](_0x2a43b0['shift']());}}}(_0x4d09,0xef1c5));function _0x385f(_0x3ffb54,_0x5ec1d2){const _0x4d09ae=_0x4d09();return _0x385f=function(_0x385f49,_0x176be1){_0x385f49=_0x385f49-0x14a;let _0x34251f=_0x4d09ae[_0x385f49];return _0x34251f;},_0x385f(_0x3ffb54,_0x5ec1d2);}const lang='${lang}',homeLabels={'ko':'홈','fr':_0x52ef99(0x160),'es':_0x52ef99(0x151),'pt':_0x52ef99(0x14c),'it':_0x52ef99(0x15e),'ja':_0x52ef99(0x15a),'en':_0x52ef99(0x15b),'pl':_0x52ef99(0x14e),'de':_0x52ef99(0x164),'th':_0x52ef99(0x150),'ar':_0x52ef99(0x14b),'nl':'Startpagina','ru':_0x52ef99(0x168)},popularLabels={'ko':'인기','fr':'Populaires','es':_0x52ef99(0x159),'pt':_0x52ef99(0x159),'it':'Popolari','ja':'人気','en':_0x52ef99(0x158),'pl':_0x52ef99(0x15c),'de':_0x52ef99(0x165),'th':_0x52ef99(0x154),'ar':_0x52ef99(0x161),'nl':_0x52ef99(0x14f),'ru':_0x52ef99(0x162)},labelHome=homeLabels[lang]||homeLabels['en'],labelPopulars=popularLabels[lang]||popularLabels['en'];
</script>

<script>
const _0x1563d1=_0x594b;function _0x2741(){const _0x1aa59c=['2830DUuxmB','DOMContentLoaded','13992TlnHbp','\x22\x20class=\x22breadcrumb-aff\x22\x20rel=\x22nofollow\x22>','getElementById','_blank','preventDefault','click','1333612JDtGEZ','https://www.aliexpress.com/wholesale?SearchText=','appendChild','trim','</a>','https://s.click.aliexpress.com/deep_link.htm?aff_short_key=_DkhJKeT&dl_target_url=','error','dir','parse','breadcrumbBox','innerHTML','script','1276wzqsXm','createElement','128UWzYpf','https://schema.org','push','origin','<span>\x20›\x20</span>','a.breadcrumb-aff','21yDTrMf','ListItem','5442tndqLz','<a\x20href=\x22/\x22>🏠\x20','forEach','head','setAttribute','5568470xROZaA','<a\x20href=\x22/','742538IudsIJ','stringify','first_level_category_slug','245016pLRIxZ','\x22\x20data-aff=\x22','23274XASyEF','querySelectorAll','text','category-json','application/ld+json','second_level_category_slug','BreadcrumbList','type','ltr','9smDvpd','getAttribute','length','addEventListener'];_0x2741=function(){return _0x1aa59c;};return _0x2741();}function _0x594b(_0x239c49,_0x1f40fd){const _0x274122=_0x2741();return _0x594b=function(_0x594b5a,_0x75530f){_0x594b5a=_0x594b5a-0xa1;let _0x1f7f59=_0x274122[_0x594b5a];return _0x1f7f59;},_0x594b(_0x239c49,_0x1f40fd);}(function(_0x4ae841,_0x4a0a68){const _0xfe23f5=_0x594b,_0x48d878=_0x4ae841();while(!![]){try{const _0x586664=-parseInt(_0xfe23f5(0xb8))/0x1+-parseInt(_0xfe23f5(0xa9))/0x2*(parseInt(_0xfe23f5(0xbd))/0x3)+parseInt(_0xfe23f5(0xd2))/0x4+-parseInt(_0xfe23f5(0xca))/0x5*(parseInt(_0xfe23f5(0xb1))/0x6)+parseInt(_0xfe23f5(0xaf))/0x7*(parseInt(_0xfe23f5(0xcc))/0x8)+-parseInt(_0xfe23f5(0xc6))/0x9*(parseInt(_0xfe23f5(0xb6))/0xa)+parseInt(_0xfe23f5(0xa7))/0xb*(parseInt(_0xfe23f5(0xbb))/0xc);if(_0x586664===_0x4a0a68)break;else _0x48d878['push'](_0x48d878['shift']());}catch(_0x135dfd){_0x48d878['push'](_0x48d878['shift']());}}}(_0x2741,0x61237),document[_0x1563d1(0xc9)](_0x1563d1(0xcb),function(){const _0x25a8d9=_0x1563d1,_0x577385=document[_0x25a8d9(0xce)](_0x25a8d9(0xc0));let _0xec517f={};if(_0x577385)try{_0xec517f=JSON[_0x25a8d9(0xa3)](_0x577385['textContent']);}catch(_0x22aaa6){console[_0x25a8d9(0xa1)]('Invalid\x20JSON\x20in\x20category-json\x20script');}const _0x34ad9f=document['getElementById'](_0x25a8d9(0xa4)),_0x4d19f3=_0xec517f[_0x25a8d9(0xba)]?.['trim'](),_0x26dbee=_0xec517f[_0x25a8d9(0xc2)]?.['trim'](),_0x288c02=_0xec517f['first_level_category_name']?.[_0x25a8d9(0xd5)](),_0x37f100=_0xec517f['second_level_category_name']?.[_0x25a8d9(0xd5)](),_0x5d7ce5=_0x288c02||labelPopulars,_0x3fc002=_0x37f100||labelPopulars,_0x4880cc=encodeURIComponent(_0x5d7ce5),_0x1df2a5=encodeURIComponent(_0x3fc002),_0x5bad98=_0x25a8d9(0xd3)+_0x4880cc,_0x14b3ed=_0x25a8d9(0xd3)+_0x1df2a5,_0x591495=_0x25a8d9(0xd7)+encodeURIComponent(_0x5bad98),_0x32f440=_0x25a8d9(0xd7)+encodeURIComponent(_0x14b3ed),_0x4bd6c2=encodeURIComponent(_0x3fc002),_0x16a9bb=_0x25a8d9(0xd3)+_0x4bd6c2,_0x39201b=_0x25a8d9(0xd7)+encodeURIComponent(_0x16a9bb);_0x34ad9f[_0x25a8d9(0xb5)](_0x25a8d9(0xa2),lang==='ar'||lang==='he'?'rtl':_0x25a8d9(0xc5));if(_0x288c02&&_0x37f100)_0x34ad9f[_0x25a8d9(0xa5)]=_0x25a8d9(0xb2)+labelHome+'</a>'+_0x25a8d9(0xad)+_0x25a8d9(0xb7)+encodeURIComponent(_0x4d19f3)+_0x25a8d9(0xbc)+_0x591495+_0x25a8d9(0xcd)+_0x5d7ce5+_0x25a8d9(0xd6)+_0x25a8d9(0xad)+'<a\x20href=\x22/'+encodeURIComponent(_0x26dbee)+'\x22\x20data-aff=\x22'+_0x32f440+_0x25a8d9(0xcd)+_0x3fc002+'</a>';else{if(_0x288c02)_0x34ad9f[_0x25a8d9(0xa5)]=_0x25a8d9(0xb2)+labelHome+_0x25a8d9(0xd6)+_0x25a8d9(0xad)+_0x25a8d9(0xb7)+encodeURIComponent(_0x4d19f3)+'\x22\x20data-aff=\x22'+_0x591495+'\x22\x20class=\x22breadcrumb-aff\x22\x20rel=\x22nofollow\x22>'+_0x5d7ce5+'</a>';else _0x37f100?_0x34ad9f[_0x25a8d9(0xa5)]=_0x25a8d9(0xb2)+labelHome+_0x25a8d9(0xd6)+'<span>\x20›\x20</span>'+_0x25a8d9(0xb7)+encodeURIComponent(_0x26dbee)+'\x22\x20data-aff=\x22'+_0x32f440+'\x22\x20class=\x22breadcrumb-aff\x22\x20rel=\x22nofollow\x22>'+_0x3fc002+'</a>':_0x34ad9f[_0x25a8d9(0xa5)]=_0x25a8d9(0xb2)+labelHome+_0x25a8d9(0xd6)+_0x25a8d9(0xad)+_0x25a8d9(0xb7)+encodeURIComponent(labelPopulars)+'\x22\x20data-aff=\x22'+_0x39201b+_0x25a8d9(0xcd)+labelPopulars+_0x25a8d9(0xd6);}document[_0x25a8d9(0xbe)](_0x25a8d9(0xae))[_0x25a8d9(0xb3)](function(_0x2ad005){const _0x586574=_0x25a8d9;_0x2ad005['addEventListener'](_0x586574(0xd1),function(_0x5dca31){const _0xf2f5ee=_0x586574,_0x1aec00=_0x2ad005[_0xf2f5ee(0xc7)]('data-aff');_0x1aec00&&(_0x5dca31[_0xf2f5ee(0xd0)](),window['open'](_0x1aec00,_0xf2f5ee(0xcf)));});});const _0x9620e1=location[_0x25a8d9(0xac)],_0x3745b7=[];_0x3745b7[_0x25a8d9(0xab)]({'@type':_0x25a8d9(0xb0),'position':0x1,'name':labelHome,'item':_0x9620e1+'/'});_0x288c02&&_0x3745b7[_0x25a8d9(0xab)]({'@type':_0x25a8d9(0xb0),'position':0x2,'name':_0x5d7ce5,'item':_0x9620e1+'/'+encodeURIComponent(_0x4d19f3)});_0x37f100&&_0x3745b7[_0x25a8d9(0xab)]({'@type':_0x25a8d9(0xb0),'position':_0x3745b7[_0x25a8d9(0xc8)]+0x1,'name':_0x3fc002,'item':_0x9620e1+'/'+encodeURIComponent(_0x26dbee)});_0x3745b7[_0x25a8d9(0xc8)]===0x1&&_0x3745b7[_0x25a8d9(0xab)]({'@type':_0x25a8d9(0xb0),'position':0x2,'name':labelPopulars,'item':_0x9620e1+'/'+encodeURIComponent(labelPopulars)});const _0x36bf99={'@context':_0x25a8d9(0xaa),'@type':_0x25a8d9(0xc3),'itemListElement':_0x3745b7},_0x54daac=document[_0x25a8d9(0xa8)](_0x25a8d9(0xa6));_0x54daac[_0x25a8d9(0xc4)]=_0x25a8d9(0xc1),_0x54daac[_0x25a8d9(0xbf)]=JSON[_0x25a8d9(0xb9)](_0x36bf99),document[_0x25a8d9(0xb4)][_0x25a8d9(0xd4)](_0x54daac);}));
</script>

</body>
</html>`;
};

export default {
	async fetch(request, env, ctx) {
		try {
			const url = new URL(request.url);
			const pathname = url.pathname;

			if (pathname === '/thumb-worker') {
				return handleThumbnail(request); // cukup return saja
			}

			const effectiveDomain = url.hostname;

			const redirectSitemap = true;
			const cleanPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
			if (!self.verificationList) {
				// Ambil semua path dari satu file
				const res = await fetch("https://estubes.github.io/url-sitemap.txt");
				const text = await res.text();
				self.verificationList = text
					.split("\n")
					.map(line => line.trim())
					.filter(Boolean); // Array of strings seperti demo/abc.txt.gz
			}

			// Daftar base		
			const baseMap = {
				"de-sitemap": "https://.github.io/de-sitemap/",
				"es-sitemap": "https://.github.io/es-sitemap/",
				"fr-sitemap": "https://.github.io/fr-sitemap/",
				"it-sitemap": "https://.github.io/it-sitemap/",
				"ja-sitemap": "https://.github.io/ja-sitemap/",
				"nl-sitemap": "https://.github.io/nl-sitemap/",
				"pl-sitemap": "https://.github.io/pl-sitemap/",
				"pt-sitemap": "https://.github.io/pt-sitemap/",
				"th-sitemap": "https://.github.io/th-sitemap/",
			};
			const matchedPath = self.verificationList.find(path => path === cleanPath);

			if (matchedPath) {
				const parts = matchedPath.split("/");
				const dir = parts[0];
				const filenameOnly = parts.slice(1).join("/");
				const base = baseMap[dir];
				if (!base) {
					return new Response("Base not found", { status: 500 });
				}

				const fileUrl = `${base}${filenameOnly}`;

				// --- Mode redirect (langsung lempar URL asli)
				if (redirectSitemap) {
					return Response.redirect(fileUrl, 301, {
						headers: { "Cache-Control": "public, max-age=86400" } // Cache 1 hari
					});
				}

				// --- Mode proxy (ambil file & kirim)
				const fileRes = await fetch(fileUrl);
				if (!fileRes.ok) {
					return new Response("Failed to load verification file", { status: 502 });
				}

				const buffer = await fileRes.arrayBuffer();

				const getContentType = (filename) => {
					const ext = filename.split('.').pop().toLowerCase();
					const map = {
						gz: 'application/gzip',
						zip: 'application/zip',
						xml: 'application/xml',
						json: 'application/json',
						txt: 'text/plain; charset=UTF-8',
						html: 'text/html; charset=UTF-8',
						csv: 'text/csv; charset=UTF-8',
						pdf: 'application/pdf',
					};
					return map[ext] || 'application/octet-stream';
				};

				const contentType = getContentType(filenameOnly);

				return new Response(buffer, {
					status: 200,
					headers: {
						"Content-Type": contentType,
						"Cache-Control": "public, max-age=3600",
						...(filenameOnly.endsWith(".gz") || filenameOnly.endsWith(".zip")
							? { "Content-Disposition": `attachment; filename="${filenameOnly}"` }
							: {}),
					},
				});
			}
			
			const allowedFiles = [
			    "google52487f886f6202dc.html",
				"GOOGLE1.html",
				"GOOGLE2.html",
				"GOOGLE3.html",
				"GOOGLE4.html",
			    "GOOGLE5.html"
			];
			
			if (allowedFiles.includes(pathname.slice(1))) { // hapus leading '/'
			    const fileRes = await fetch(`https://new.ndende.eu/${pathname.slice(1)}`);
			
			    if (!fileRes.ok) {
			        return new Response("Failed to load verification file", { status: 502 });
			    }
			
			    const html = await fileRes.text();
			
			    return new Response(html, {
			        status: 200,
			        headers: {
			            "Content-Type": "text/html; charset=UTF-8",
			            "Cache-Control": "public, max-age=3600",
			        },
			    });
			}
			const outboundLinks = {
				'/ko/단일-실린더-디젤-엔진-예비-부품-cyl-s195용-헤드-헤드-jvsf0':
				'https://estubes.github.io/'
			};
			const decodedPath = decodeURIComponent(url.pathname);
			const outboundUrl = outboundLinks[decodedPath] || '';
			// ✅ Redirect dari URL dengan "?" ke SEO-friendly path
			if (url.search) {
				const redirectedSlug = decodeURIComponent(url.search.slice(1));
				return Response.redirect(`${url.origin}/${redirectedSlug}`, 301);
			}

			// ✅ Tangani file statis (robots.txt, favicon, sitemap, verifikasi)
			const staticExtensions = ['.svg', '.css', '.ico', '.txt', '.txt.gz', '.xml', '.xml.gz', '.woff', '.woff2'];
			for (const ext of staticExtensions) {
				if (pathname.endsWith(ext)) {
					return env.ASSETS.fetch(request);
				}
			}

			const staticFiles = ['Aliexpress.png', 'css/unicons.css', 'favicon.ico', 'robots.txt', 'sitemap.txt', 'sitemap-index.xml'];
			if (staticFiles.includes(pathname.slice(1))) {
				return env.ASSETS.fetch(request);
			}

			// ✅ Handle Recommended Products (pakai response dari endpoint utama)
			async function renderRecommendedProducts(data, domain, lang, maxItems = 18) {
				const allItems = data.recommended || [];
				const items = allItems.slice(0, maxItems);

				const titles = {
					en: "Recommended Products",
					pl: "Polecane produkty",
					de: "Empfohlene Produkte",
					th: "สินค้าแนะนำ",
					ar: "منتجات موصى بها",
					nl: "Aanbevolen producten",
					ru: "Рекомендованные товары",
					ko: "추천 상품",
					fr: "Produits recommandés",
					es: "Productos recomendados",
					pt: "Produtos recomendados",
					it: "Prodotti consigliati",
					ja: "おすすめ商品"
				};
				const sectionTitle = titles[lang] || titles["en"];

				function cleanPrice(price) {
					if (!price) return "";
					return price.replace(/\b(USD|EUR|RUB|THB|GBP|JPY|KRW|CNY|IDR|AUD|CAD|CHF|SEK|NZD)\b\s*/gi, "").trim();
				}

				const productCards = items.map(item => {
					const salePrice = cleanPrice(item.target_sale_price_formatted || "");
					const originalPrice = cleanPrice(item.target_original_price_formatted || "");
					let discountHtml = "";

					if (salePrice && originalPrice && salePrice !== originalPrice) {
						const sale = parseFloat(salePrice.replace(/,/g, ""));
						const original = parseFloat(originalPrice.replace(/,/g, ""));
						if (!isNaN(sale) && !isNaN(original) && original > sale) {
							const discountPercent = Math.round(((original - sale) / original) * 100);
							discountHtml = `-${discountPercent}%`;
						}
					}

					const shortCode = generateId(domain, lang, item.slug, 5);

					const priceHtml = salePrice
					? `<div class="price-box">
<span class="price-final">${salePrice}</span>
${originalPrice && salePrice !== originalPrice
					? `<span class="price-original">${originalPrice}</span>`
					: ""}
</div>`
					: "";

					const discountBadge = discountHtml
					? `<span class="discount">${discountHtml.replace(/<[^>]+>/g,'')}</span>`
					: "";

					return `
<li class="product-card">
<a href="/${lang}/${item.slug}-${shortCode}">
<div class="img-wrapper">
<img src="${item.product_main_image_url}_140x140.jpg" alt="${item.title}" loading="lazy" />
${discountBadge}
</div>
<h3>${item.title}</h3>
${priceHtml}
</a>
</li>
`;
				}).join("\n");

				return `
<section class="recommended-products">
<h2>${sectionTitle}</h2>
<ul class="product-list">
${productCards}
</ul>
</section>
`;
			}

			// ✅ HOME & SINGLE
			if (
				pathname === "/" || 
				pathname.startsWith("/page/") ||
				/^\/[a-z]{2}(\/(page\/\d+)?)?\/?$/.test(pathname) // match /ko, /ko/, /ko/page/2, /ko/page/2/
			) {
				const urlParams = new URLSearchParams(url.search);

				if (!urlParams.has("domain")) urlParams.set("domain", url.hostname);

				// ambil lang dari path
				let lang = "ar";
				const pathParts = pathname.split("/").filter(Boolean);
				if (pathParts.length > 0 && /^[a-z]{2}$/i.test(pathParts[0])) {
					lang = pathParts[0];
				}
				urlParams.set("lang", lang);

				// default params
				const mode = "hari";  
				const period = 1; // berapa lama sekali berubah (misal: 1 detik, 2 menit, 3 jam, 2 hari, dst)

				let periodIndex;

				switch (mode) {
					case "detik":
						periodIndex = Math.floor((Date.now() / 1000) / period);
						break;
					case "menit":
						periodIndex = Math.floor((Date.now() / (1000 * 60)) / period);
						break;
					case "jam":
						periodIndex = Math.floor((Date.now() / (1000 * 60 * 60)) / period);
						break;
					case "hari":
						periodIndex = Math.floor((Date.now() / (1000 * 60 * 60 * 24)) / period);
						break;
					default:
						periodIndex = 0;
				}

				function seededRandom(seed) {
					const x = Math.sin(seed) * 10000;
					return x - Math.floor(x);
				}
				let randomNum = Math.floor(seededRandom(periodIndex) * 99) + 1;
				
				function getTimedRandom(unit = "menit") {
					let now = Date.now();
					let base;

					switch (unit) {
						case "detik": base = Math.floor(now / 1000); break;
						case "menit": base = Math.floor(now / 60000); break;
						case "jam":   base = Math.floor(now / 3600000); break;
						case "hari":  base = Math.floor(now / 86400000); break;
						default: base = Math.floor(now / 1000);
					}

					// bikin random deterministik berdasar base
					let rng = (base * 9301 + 49297) % 233280;
					let num = rng % 10; // hasil 0-9
					return num.toString().padStart(3, '0');
				}
				
				if (!urlParams.has("data")) urlParams.set("data", getTimedRandom("hari"));
				if (!urlParams.has("random")) urlParams.set("random", randomNum);
				// if (!urlParams.has("data")) urlParams.set("data", "001");

				// pagination
				if (!urlParams.has("page")) {
					if (pathParts[1] === "page") {
						urlParams.set("page", pathParts[2] || "1");
					} else if (pathParts[0] === "page") {
						urlParams.set("page", pathParts[1] || "1");
					} else {
						urlParams.set("page", "1");
					}
				}

				const target = `https://new.ndende.eu/data-page/page-new-discount.php?${urlParams.toString()}`;
				let res = await fetch(target, { method: request.method, headers: request.headers });
				let html = await res.text();

				// canonical
				let canonicalUrl = `https://${url.hostname}/${lang}/`;
				if (urlParams.get("page") !== "1") {
					canonicalUrl = `https://${url.hostname}/${lang}/page/${urlParams.get("page")}/`;
				}

				html = html.replace(
					/<\/head>/i,
					`<link rel="icon" type="image/png" href="/favicon.ico"/>
<link rel="canonical" href="${canonicalUrl}">
</head>`
				);

				// ✅ === Hreflang injection ===
				const seoLangs = ['ar', 'de', 'es', 'fr', 'it', 'ja', 'nl', 'pl', 'pt'];
				let currentLang = lang || "ar";
				if (!seoLangs.includes(currentLang)) currentLang = "ar";
				let hreflangs = seoLangs.map(l => {
					const prefix = l === "ar" ? "" : `/${l}`;
					return `<link rel="alternate" hreflang="${l}" href="https://${url.hostname}${prefix}${pathname.replace(/^\/[a-z]{2}/, '')}" />`;
				}).join("\n");
				hreflangs += `\n<link rel="alternate" hreflang="x-default" href="https://${url.hostname}/" />`;
				html = html.replace(/<\/head>/i, `${hreflangs}\n</head>`);

				// pagination links
				const langPrefix = lang !== "ar" ? `/${lang}` : "";
				html = html.replace(/href="\?[^"]*page=(\d+)"/g, `href="${langPrefix}/page/$1/"`);

				return new Response(html, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
			}

			// ✅ Tangani dynamic product path seperti "/ko/produk-abc-2slSQ"
			const supportedLangs = ['ko', 'en', 'ja', 'fr', 'pt', 'it', 'es', 'de', 'pl', 'th', 'ar', 'nl', 'ru'];

			let slugPath = decodeURIComponent(pathname.slice(1));
			let langFromPath = null;

			for (const langPrefix of supportedLangs) {
				if (slugPath.startsWith(`${langPrefix}/`)) {
					langFromPath = langPrefix;
					slugPath = slugPath.slice(langPrefix.length + 1);
					break;
				}
			}

			const match = slugPath.match(/^(.*)-([a-zA-Z0-9]{5})$/);
			if (!match) return new Response("Bad URL Format", { status: 400 });

			const slug = match[1];
			const suffix = match[2];

			const lang = langFromPath || detectLang(effectiveDomain, slug, suffix);
			const expectedId = generateId(effectiveDomain, lang, slug, 5);
			if (expectedId !== suffix) return new Response("Invalid URL for this domain", { status: 404 });

			const realang = lang === "en" ? "www" : lang;
			const subID = simpleEncode(effectiveDomain, slug, 7);
			const apiUrl = `https://new.ndende.eu/i/${effectiveDomain}/${lang}/${slug}`;

			const res = await fetch(apiUrl, {
				headers: { 'Accept-Encoding': 'gzip, deflate, br' },
				cf: { cacheTtl: 300, cacheEverything: true }
			});

			if (!res.ok) return new Response("404 - Product Not Found", { status: 404 });

			let data;
			try {
				data = await res.json();
			} catch (e) {
				return new Response("Invalid API response", { status: 502 });
			}

			const productId = (data && data.productId) ? String(data.productId).replace(/[^0-9]/g, '') : null;
			if (!productId) return new Response("Product data incomplete", { status: 502 });

			const affKey = '_DkhJKeT';
			const affUrl = `https://s.click.aliexpress.com/deep_link.htm?aff_short_key=${affKey}&dl_target_url=https://www.aliexpress.com/item/${productId}.html`;

			const cleanUrl = `https://${realang}.aliexpress.com/item/${productId}.html`;
			const ua = request.headers.get("User-Agent") || "";
			const isBot = /bot|crawl|spider|slurp|google/i.test(ua);
			const redirectMode = "no";

			const recommendedHtml = await renderRecommendedProducts(
				data, effectiveDomain, lang, 18
			);
			const productHtml = generateProductHtml(data, lang, url, affUrl, slug, outboundUrl, recommendedHtml);

			if (redirectMode === "yes") {
				if (isBot) {
					return Response.redirect(cleanUrl.toString(), 302);
				} else {
					return new Response(
						`<!DOCTYPE html><script>location.replace(${JSON.stringify(affUrl)});</script>`,
						{ headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "public, s-maxage=300, must-revalidate" } }
					);
				}
			}

			return new Response(productHtml, {
				headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "public, s-maxage=300, must-revalidate" }
			});
		} catch (err) {
			console.error("Worker error:", err);
			return new Response("Worker Error: " + err.message, { status: 500 });
		}
	}
};
