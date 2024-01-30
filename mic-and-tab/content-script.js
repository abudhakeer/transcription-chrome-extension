let socket;

chrome.storage.local.set({ transcript: "" });

let apiKey = "bd7d01faf4086045f8f1e7ff4f0c06983d608352";

startRecording();

let mediaRecorder;

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  console.log("[CS] After mic stream....", stream);

  mediaRecorder = new MediaRecorder(stream);

  let chunks = [];

  mediaRecorder.addEventListener("dataavailable", (event) => {
    console.log("event: ", event);
    chunks.push(event.data);

    console.log("CHUNKS: ", chunks);
  });

  mediaRecorder.addEventListener("stop", async () => {
    console.log("Stopping recording....");

    const audioBlob = new Blob(chunks, {
      type: "audio/webm",
    });

    const file = audioBlob;

    const storedToken = "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";

    const headers = new Headers({
      Authorization: `Bearer ${storedToken}`,
    });
    const formData = new FormData();
    formData.append("file", file, "recording.webm");
    formData.append("model", "whisper-1");

    const requestOptions = {
      method: "POST",
      headers,
      body: formData,
      redirect: "follow",
    };

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      requestOptions
    );
    if (response.status === 200) {
      const result = await response.json();
      const resultText = result.text;

      console.log("Text successfully saved: ", resultText);

      stream.getTracks().forEach((track) => track.stop());
    } else {
      stream.getTracks().forEach((track) => track.stop());
    }
  });

  mediaRecorder.start();
}

chrome.runtime.onMessage.addListener(({ message }) => {
  if (message == "stop") {
    mediaRecorder.stop();
  }
});
