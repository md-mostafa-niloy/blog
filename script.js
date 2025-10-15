document.addEventListener('DOMContentLoaded', () => {
    const postsListContainer = document.getElementById('posts-list-container');
    const postContentContainer = document.getElementById('post-content');

    if (postsListContainer) {
        loadPosts();
    } else if (postContentContainer) {
        loadSinglePost();
    }
});

async function fetchPosts() {
    const response = await fetch('posts.json');
    if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
    return await response.json();
}

async function loadPosts() {
    try {
        const posts = await fetchPosts();
        const postsListContainer = document.getElementById('posts-list-container');
        posts.sort((a, b) => b.id.localeCompare(a.id));

        posts.forEach(post => {
            const postElement = document.createElement('article');
            postElement.className = 'post-summary';
            postElement.innerHTML = `
                <h2><a href="post.html?id=${post.id}">${post.title}</a></h2>
                <p class="meta">By ${post.author} on ${post.date}</p>
                <p>${post.summary}</p>
                <a href="post.html?id=${post.id}" class="read-more">Read More →</a>
            `;
            postsListContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Failed to load posts:', error);
    }
}

async function loadSinglePost() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        if (!postId) {
            document.getElementById('post-content').innerHTML = "<p>Post not found.</p>";
            return;
        }

        const posts = await fetchPosts();
        const post = posts.find(p => p.id === postId);

        if (post) {
            // --- 1. DYNAMICALLY UPDATE SEO META TAGS ---
            document.title = post.title;
            updateMetaTag('meta[name="description"]', 'content', post.summary);
            updateMetaTag('meta[property="og:title"]', 'content', post.title);
            updateMetaTag('meta[property="og:description"]', 'content', post.summary);
            updateMetaTag('meta[property="twitter:title"]', 'content', post.title);
            updateMetaTag('meta[property="twitter:description"]', 'content', post.summary);
            const canonicalUrl = `${window.location.origin}${window.location.pathname}?id=${post.id}`;
            updateMetaTag('meta[property="og:url"]', 'content', canonicalUrl);

            // --- 2. GENERATE AND INJECT GOOGLE SCHEMA (FIXED) ---
            const ratingValue = (Math.random() * (4.9 - 4.5) + 4.5).toFixed(1);
            const reviewCount = Math.floor(Math.random() * (2000 - 1200 + 1)) + 1200;
            
            // **CORRECTED SCHEMA:** `aggregateRating` is now nested inside `BlogPosting`.
            const schema = {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
                "headline": post.title,
                "description": post.summary,
                "image": "https://visernic.com/wp-content/uploads/2025/03/visernic-1.png",
                "author": { "@type": "Person", "name": post.author },
                "publisher": {
                    "@type": "Organization", "name": "My Blog",
                    "logo": { "@type": "ImageObject", "url": "https://i.postimg.cc/L8PPqhKk/v.png" }
                },
                "datePublished": new Date(post.date).toISOString(),
                // The `aggregateRating` object is now correctly placed here.
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": ratingValue,
                    "reviewCount": reviewCount
                }
            };

            const schemaScript = document.createElement('script');
            schemaScript.type = 'application/ld+json';
            schemaScript.innerHTML = JSON.stringify(schema);
            document.head.appendChild(schemaScript);

            // --- 3. INJECT POST CONTENT ---
            document.getElementById('post-title').innerText = post.title;
            document.getElementById('post-meta').innerText = `By ${post.author} on ${post.date}`;
            document.getElementById('post-content').innerHTML = marked.parse(post.content);

            // --- 4. ACTIVATE INTERACTIVE RATING STARS ---
            activateRatingStars();

        } else {
            document.getElementById('post-content').innerHTML = "<p>Sorry, this post could not be found.</p>";
            document.title = "Post Not Found";
        }
    } catch (error) {
        console.error('Failed to load the post:', error);
    }
}

function updateMetaTag(selector, attribute, value) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attribute, value);
}

function activateRatingStars() {
    const stars = document.querySelectorAll('.star');
    const ratingMessage = document.getElementById('rating-message');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = star.getAttribute('data-value');
            ratingMessage.innerText = `Thanks! You rated this post ${value} out of 5 stars.`;
        });
    });
}
