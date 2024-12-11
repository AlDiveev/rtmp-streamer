<template>
    <div class="app">
        <!-- Full-width Header Image -->
        <div class="header-image-container">
            <img src="/public/header.png" alt="Header Image" class="header-image" />

            <div class="header-overlay">
                <h1>Video to RTMP Stream</h1>
                <p>Convert and stream your MP4 videos effortlessly!</p>

                <div class="clipboard-container">
                    <input
                        type="text"
                        :value="currentUrl"
                        readonly
                        class="clipboard-input"
                    />
                    <button @click="copyCurrentUrl" class="clipboard-button">
                        Copy
                    </button>
                    &nbsp;
                    <button v-if="!isStreaming" @click="createNewSession" class="new-session-button">New Session</button>
                </div>


            </div>

            <!-- On Air Indicator -->
            <div v-if="isStreaming" class="on-air-indicator">
                <span>On Air</span>
            </div>

        </div>

        <div class="app-container">
            <!-- File Upload Section -->
            <header>
            </header>

            <!-- File Upload Section -->
            <div class="upload-section">
                <div
                    class="drop-area"
                    @dragover.prevent
                    @drop.prevent="handleFileDrop"
                    :class="{ 'drop-active': isDragging }"
                    @dragenter="isDragging = true"
                    @dragleave="isDragging = false"
                >
                    <p>Drag & drop your .mp4 files here or click to upload</p>

                    <div class="upload-icon" @click="triggerFileInput">
                        <span class="plus-icon">+</span>
                    </div>

                    <input
                        type="file"
                        ref="fileInput"
                        multiple
                        @change="handleFileUpload"
                        accept=".mp4, .mov"
                        class="file-input"
                        hidden="hidden"
                    />
                </div>

                <div v-if="progressUpload > 0" class="upload-progress">
                    <div class="progress-bar">
                        <div class="progress" :style="{ width: progressUpload + '%' }"></div>
                    </div>
                    <p>{{ progressUpload }}%</p>
                </div>

                <!-- Finder-Style File List -->
                <div v-if="uploadedFiles.length" class="file-list-finder">
                    <header class="finder-header">
                        <h3>Select uploaded Files</h3>
                    </header>
                    <div class="finder-content">



                        <div
                            v-for="(file, index) in uploadedFiles"
                            :key="index"
                            class="file-item"
                            :class="{ 'selected': selectedFile === file, 'processing': this.isProcessing }"
                            @click="selectFile(file)"
                        >
                            <div class="file-icon">
                                <i
                                    v-if="!this.isProcessing"
                                    class="pi pi-file text-color-secondary"
                                    style="font-size: 2.0rem"
                                ></i>
                                <img
                                    v-if="this.isProcessing"
                                    src="/public/preload.gif"
                                    alt="Loading..."
                                    class="preloader-icon"
                                />
                            </div>
                            <p class="file-name">{{ truncateFileName(file.name) }}</p>

                            <!-- Кнопка для удаления -->
                            <button @click.stop="removeFile(file)" class="delete-button" title="Delete file">
                                ✖
                            </button>
                        </div>
                    </div>
                </div>


            </div>

            <!-- RTMP Server URL + Stream Key -->
            <div class="input-section">
                <label for="rtmp-url">RTMP URL (including stream key):</label>
                <input
                    type="text"
                    id="rtmp-url"
                    v-model="rtmpUrl"
                    placeholder="Enter RTMP URL with stream key (e.g., rtmp://a.rtmp.youtube.com/live2/stream-key)"
                    :disabled="isStreaming"
                />
            </div>

            <!-- Buttons -->
            <div class="button-section">
                <button
                    :disabled="!isReadyToStream && !isStreaming"
                    @click="isStreaming ? stopStream() : startStream()">
                    {{ isStreaming ? "Stop Stream" : "Start Stream" }}
                </button>
            </div>

            <!-- Progress Indicator -->
            <div v-if="isStreaming" class="progress-section">
                <p>Streaming in progress...</p>
                <div class="progress-bar">
                    <div class="progress" :style="{ width: progress + '%' }"></div>
                </div>
            </div>

            <!-- Error Handling -->
            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

            <footer>
                <p>Powered by <a href="https://github.com/AlDiveev">Alex</a></p>
            </footer>
        </div>

    </div>
</template>





<script>
export default {
    data() {
        return {
            API_BASE_URL: "theytube.live",
            uploadedFiles: [],
            selectedFile: null,
            rtmpUrl: "",
            isStreaming: false,
            progress: 0,
            errorMessage: "",
            isDragging: false,
            progressInterval: null,
            videoDuration: 300,
            progressUpload: 0,
            isProcessing: false,
            isReady: false,

        };
    },
    computed: {
        // isReadyToStream() {
        //     return this.selectedFile && this.rtmpUrl && !this.isStreaming;
        // },


        currentUrl() {
            return window.location.href;
        },

    },
    methods: {

        isReadyToStream() {
            return this.selectedFile?.isReady && this.rtmpUrl && !this.isStreaming;
        },

        encodeToBase64(str) {
            return btoa(unescape(encodeURIComponent(str)));
        },

        async checkConversionStatus(file) {
            try {
                const response = await fetch(`https://${this.API_BASE_URL}:3000/api/stream/check-source`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        session: this.$route.params["session"],
                        videoName: file.name,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to check file status");
                }

                const data = await response.json();
                return data.message === "File is ready for streaming";
            } catch (error) {
                console.error("Error checking file status:", error.message);
                this.errorMessage = `Error checking file status: ${error.message}`;
                return false;
            }
        },
        async monitorFileConversion(file) {
            this.isProcessing = true;
            const interval = setInterval(async () => {
                const isReady = await this.checkConversionStatus(file);
                if (isReady) {
                    clearInterval(interval);
                    this.isProcessing = false;
                    this.isReady = true;
                }
            }, 5000);
        },

        async removeFile(file) {
            try {
                const streamSession = this.$route.params['session'];
                if (!streamSession) {
                    throw new Error("Stream session parameter is missing.");
                }

                const encodedFileName = this.encodeToBase64(file.name);

                const response = await fetch(
                    `https://${this.API_BASE_URL}:3000/api/storage/${streamSession}/${encodedFileName}`,
                    {
                        method: "DELETE",
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to delete the file.");
                }

                this.uploadedFiles = this.uploadedFiles.filter((uploadedFile) => uploadedFile !== file);
            } catch (error) {
                this.errorMessage = `Error deleting file: ${error.message}`;
            }
        },

        copyCurrentUrl() {
            navigator.clipboard.writeText(this.currentUrl)
                .then(() => {
                    alert("Current page URL copied to clipboard!");
                })
                .catch((error) => {
                    console.error("Failed to copy URL: ", error);
                });
        },

        async checkActiveStream() {
            try {
                const response = await fetch(`https://${this.API_BASE_URL}:3000/api/stream/list`);
                if (!response.ok) {
                    throw new Error("Failed to fetch active streams.");
                }
                const data = await response.json();

                const streamSession = this.$route.params['session'];

                // Проверяем, существует ли активный процесс с текущей сессией
                const activeStream = data.activeProcesses.find(
                    (process) => process.name === streamSession
                );

                if (activeStream) {
                    this.isStreaming = true;
                    this.rtmpUrl = activeStream.ffmpeg.find(arg => arg.startsWith("rtmp://"));
                    console.log("Active stream found:", activeStream);
                }
            } catch (error) {
                console.error("Error checking active stream:", error.message);
                this.errorMessage = `Error checking active stream: ${error.message}`;
            }
        },

        async fetchFilesFromBackend() {
            try {
                const streamSession = this.$route.params['session'];
                if (!streamSession) {
                    throw new Error("Stream session parameter is missing.");
                }

                const response = await fetch(`https://${this.API_BASE_URL}:3000/api/storage/${streamSession}/list`);
                if (!response.ok) {
                    throw new Error("Failed to fetch file list from the server.");
                }

                const data = await response.json();
                this.uploadedFiles = data.storages.map((fileName) => ({
                    name: fileName,
                    savedPath: `${streamSession}/${fileName}`,
                }));
            } catch (error) {
                this.errorMessage = error.message;
            }
        },

        async uploadFileToBackend(file) {
            try {
                const streamSession = this.$route.params['session'];
                if (!streamSession) {
                    throw new Error("Stream session parameter is missing.");
                }

                const formData = new FormData();
                formData.append("file", file);

                const xhr = new XMLHttpRequest();
                xhr.open("POST", `https://${this.API_BASE_URL}:3000/api/storage/${streamSession}/upload`, true);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        this.progressUpload = Math.round((event.loaded / event.total) * 100);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        console.log("File uploaded successfully", data.filePath);

                        file.savedPath = data.filePath;

                        this.uploadedFiles.push({
                            name: file.name,
                            savedPath: `/${streamSession}/${file.name}`,
                        });
                        this.progressUpload = 0;
                    } else {
                        throw new Error("File upload failed");
                    }
                };

                xhr.onerror = () => {
                    throw new Error("An error occurred during the file upload.");
                };
                xhr.send(formData);
            } catch (error) {
                this.errorMessage = "Error: " + error.message;
            }
        },

        async addFiles(files) {
            for (const file of files) {
                const allowedTypes = ["video/mp4", "video/quicktime"];
                if (allowedTypes.includes(file.type)) {
                    try {
                        this.errorMessage = "";
                        await this.uploadFileToBackend(file);
                        this.isProcessing = false;
                        this.isReady = false;
                        this.uploadedFiles.push(file);

                        this.monitorFileConversion(file);
                    } catch (error) {
                        this.errorMessage = "Error: " + error.message;
                    }
                } else {
                    this.errorMessage = "Only .mp4 and .mov files are allowed";
                }
            }
        },


        handleFileUpload(event) {
            const files = Array.from(event.target.files);
            this.addFiles(files);
        },

        handleFileDrop(event) {
            const files = Array.from(event.dataTransfer.files);
            this.addFiles(files);
            this.isDragging = false;
        },

        selectFile(file) {
            this.selectedFile = file;
            this.videoDuration = this.estimateVideoDuration(file.name);
        },

        estimateVideoDuration(fileName) {
            const baseDuration = 300;
            return baseDuration + (fileName.length % 60);
        },

        async startStream() {
            const streamSession = this.$route.params['session'];

            if (this.isStreaming) {
                this.stopStream();
                return;
            }

            try {
                if (!this.selectedFile || !this.rtmpUrl) {
                    throw new Error("File and RTMP URL are required to start streaming.");
                }

                this.isStreaming = true;
                this.errorMessage = "";

                const response = await fetch(`https://${this.API_BASE_URL}:3000/api/stream/create`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: streamSession,
                        videoPath: this.selectedFile.savedPath,
                        rtmpTarget: this.rtmpUrl,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to start streaming.");
                }

                this.startProgress();
            } catch (error) {
                this.errorMessage = error.message;
            }
        },

        async stopStream() {
            try {

                const streamSession = this.$route.params['session'];
                if (!this.isStreaming) return;

                const response = await fetch(`https://${this.API_BASE_URL}:3000/api/stream/stop/${streamSession}`, {
                    method: "GET",
                });

                if (!response.ok) {
                    throw new Error("Failed to stop streaming.");
                }

                this.isStreaming = false;
                this.progress = 0;

                if (this.progressInterval) {
                    clearInterval(this.progressInterval);
                    this.progressInterval = null;
                }
            } catch (error) {
                this.errorMessage = error.message;
            }
        },

        startProgress() {
            const totalDuration = this.videoDuration * 1000;
            const intervalDuration = 100;

            let elapsedTime = 0;

            this.progressInterval = setInterval(() => {
                if (!this.isStreaming) {
                    clearInterval(this.progressInterval);
                    this.progressInterval = null;
                    return;
                }

                elapsedTime += intervalDuration;
                this.progress = Math.min((elapsedTime / totalDuration) * 100, 100);
                if (elapsedTime >= totalDuration) {
                    elapsedTime = 0;
                    this.progress = 0;
                }
            }, intervalDuration);
        },

        triggerFileInput() {
            this.$refs.fileInput.click();
        },

        truncateFileName(fileName) {
            return fileName.length > 20 ? fileName.slice(0, 17) + "..." : fileName;
        },


        createNewSession() {
            const uniqueId = Math.random().toString(36).substr(2, 9);
            const newUrl = `/${uniqueId}`;
            window.location.href = newUrl;
        },
    },
    mounted() {
        this.fetchFilesFromBackend();
        this.checkActiveStream();
    },
};

</script>

<style>

.on-air-indicator {
    position: absolute;
    top: 20px;
    right: 20px;
    background-color: red;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    font-weight: bold;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    z-index: 10;
    text-transform: uppercase;
}

/* Full-width Header Image */
.header-image-container {
    position: relative;
    width: 100%;
    height: 300px; /* Adjust height as needed */
    overflow: hidden;
}

.header-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
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



/* Global Styles */
body {
    font-family: Arial, sans-serif;
    background-color: #f9f9f9;
    margin: 0;
    padding: 0;
}

.app-container {
    max-width: 600px;
    margin: 50px auto;
    padding: 20px;
    background-color: #fff;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    text-align: center;
}

/* Drop Area */
.drop-area {
    border: 2px dashed #007bff;
    padding: 20px;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 0.3s;
    position: relative;
}

.drop-area:hover,
.drop-area.drop-active {
    background-color: #e7f3ff;
}

/* Upload Icon */
.upload-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #ccc;
    color: white;
    font-size: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin: 0 auto;
    transition: background-color 0.3s;
}

.upload-icon:hover {
    background-color: #007bff;
}

/* Finder-Style File List */
.file-list-finder {
    border: 1px solid #ccc;
    border-radius: 10px;
    margin: 20px 0;
    overflow: hidden;
    background-color: #fefefe;
}

.finder-header {
    background-color: #e8e8e8;
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #ccc;
}

.finder-header h3 {
    margin: 0;
    font-size: 16px;
}

.finder-content {
    display: flex;
    flex-wrap: wrap;
    padding: 10px;
    gap: 10px;
}

.file-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 100px;
    border: 1px solid transparent;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s, border 0.3s;
}

.file-item:hover {
    background-color: #f0f8ff;
}

.file-item.selected {
    border: 2px solid #007bff;
    background-color: #e7f3ff;
}

.file-icon {
    width: 50px;
    height: 50px;
    margin-bottom: 10px;
}

.file-name {
    font-size: 12px;
    text-align: center;
    word-break: break-word;
}

/* Input Section */
.input-section input {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 5px;
}

/* Buttons */
.button-section button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.button-section button:hover:not(:disabled) {
    background-color: #0056b3;
}

.button-section button:disabled {
    background-color: #e0e0e0;
    cursor: not-allowed;
}

/* Progress Bar */
.progress-section {
    margin-top: 20px;
}

.progress-bar {
    width: 100%;
    background-color: #f0f0f0;
    height: 20px;
    border-radius: 5px;
    overflow: hidden;
}

.progress {
    height: 100%;
    background-color: #007bff;
    width: 0%;
}

/* Error Message */
.error-message {
    color: red;
    font-weight: bold;
    margin-top: 10px;
}

/* Footer */
footer {
    margin-top: 30px;
    font-size: 12px;
    color: #000000;
}
.clipboard-container {
    display: flex;
    align-items: center;
    margin-top: 10px;
}

.clipboard-input {
    width: 230px;
    padding: 8px;
    margin-right: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
}

input {
    color: #333 !important;
}

.clipboard-button {
    padding: 8px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.clipboard-button:hover {
    background-color: #0056b3;
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

.upload-progress {
    margin-top: 20px;
    text-align: center;
}

.progress-bar {
    width: 100%;
    background-color: #f0f0f0;
    height: 20px;
    border-radius: 5px;
    overflow: hidden;
    margin: 10px 0;
}

.progress {
    height: 100%;
    background-color: #007bff;
    width: 0%;
    transition: width 0.3s;
}
.delete-button {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: transparent;
    border: none;
    font-size: 16px;
    color: red;
    cursor: pointer;
    transition: color 0.3s;
}

.delete-button:hover {
    color: darkred;
}

.file-item.processing {
    opacity: 0.5;
    pointer-events: none;
}

.preloader-icon {
    width: 30px;
    height: 30px;
}

</style>
