<template>
    <div class="landing-page">
        <!-- Hero Section -->
        <div class="hero-section">
            <div class="header-overlay">
                <h1>Video to RTMP Stream</h1>
                <p>Convert and stream your MP4 videos effortlessly!</p>
            </div>
        </div>

        <!-- How It Works Section -->
        <div class="how-it-works-section">
            <h2>How It Works</h2>
            <ol>
                <li>Upload your MP4 file.</li>
                <li>Enter your RTMP stream URL (e.g., YouTube RTMP).</li>
                <li>Click "Start Streaming" and go live!</li>
            </ol>
            <p>
                Need help setting up your RTMP URL?
                <a href="https://support.google.com/youtube/answer/2907883" target="_blank" class="link">
                    Learn more here.
                </a>
            </p>
            <p>&nbsp;</p>
            <button @click="createNewSession" class="new-session-button" >New Session</button>
        </div>

        <!-- Contact Form Section -->
        <div class="contact-form-section">
            <h2>Get in Touch</h2>
            <p>Have questions or feedback? Let us know below!</p>
            <form @submit.prevent="submitForm">
                <input
                    type="text"
                    v-model="name"
                    placeholder="Your Name"
                    required
                />
                <input
                    type="email"
                    v-model="email"
                    placeholder="Your Email"
                    required
                />
                <textarea
                    v-model="message"
                    placeholder="Your Message"
                    rows="5"
                    required
                ></textarea>
                <button type="submit">Submit</button>
            </form>
            <p v-if="formSuccess" class="success-message">
                Thank you for your message! We'll get back to you soon.
            </p>
        </div>

        <!-- Footer -->
        <footer>
            <p>© 2024 Video to RTMP Stream. All rights reserved.</p>
        </footer>
    </div>
</template>

<script>
export default {
    data() {
        return {
            name: "",
            email: "",
            message: "",
            formSuccess: false,
        };
    },
    methods: {
        submitForm() {
            this.formSuccess = true;
            this.name = "";
            this.email = "";
            this.message = "";
        },

        createNewSession() {
            const uniqueId = Math.random().toString(36).substr(2, 9);
            const newUrl = `/${uniqueId}`;
            window.location.href = newUrl;
        },
    },
};
</script>

<style>
/* Hero Section */
.hero-section {
    position: relative;
    height: 400px;
    background-image: url('/public/header.png');
    background-size: cover;
    background-position: center;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    text-align: center;
}

.header-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5); /* Transparent overlay */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #ffffff;
    text-align: center;
    padding: 20px;
}

.header-overlay h1 {
    font-size: 36px;
    margin: 0;
    font-weight: bold;
    color: #ffffff;
}

.header-overlay p {
    font-size: 18px;
    margin-top: 10px;
}


/* Features Section */
.features-section {
    padding: 50px 20px;
    text-align: left; /* Выровнять текст по левому краю */
}

.features-section h2 {
    font-size: 28px;
    margin-bottom: 20px;
    text-align: center; /* Заголовок остаётся по центру */
}

.features-section ul {
    list-style: none;
    padding: 0;
}

.features-section li {
    font-size: 18px;
    margin: 10px 0;
}

/* How It Works Section */
.how-it-works-section {
    padding: 50px 20px;
    background-color: #f9f9f9;
    text-align: center;
}

.how-it-works-section h2 {
    font-size: 28px;
    margin-bottom: 20px;
}

.how-it-works-section ol {
    list-style-position: inside;
}

.how-it-works-section a.link {
    color: #007bff;
    text-decoration: underline;
}

.how-it-works-section a.link:hover {
    text-decoration: none;
}

/* Contact Form Section */
.contact-form-section {
    padding: 50px 20px;
    text-align: center;
}

.contact-form-section h2 {
    font-size: 28px;
    margin-bottom: 20px;
}

.contact-form-section form {
    max-width: 400px;
    margin: 0 auto;
}

.contact-form-section input,
.contact-form-section textarea {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.contact-form-section button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.contact-form-section button:hover {
    background-color: #0056b3;
}

.success-message {
    color: green;
    margin-top: 20px;
}

/* Footer */
footer {
    padding: 20px;
    text-align: center;
    background-color: #333;
    color: white;
    font-size: 14px;
}

.new-session-button {
    margin-left: 10px;
    padding: 10px 20px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.new-session-button:hover {
    background-color: #218838;
}
</style>
