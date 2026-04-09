async function upload() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("Bitte Datei auswählen");

  // 🔐 Auth vom Worker holen
  const auth = await fetch("https://abiturplanung2027-database.lostixd8.workers.dev/api/auth/upload", {
    headers: {
      Authorization: "mein-geheimes-passwort"
    }
  }).then(res => res.json());

  // 📦 Upload zu ImageKit
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", file.name);
  formData.append("publicKey", auth.publicKey);
  formData.append("signature", auth.signature);
  formData.append("expire", auth.expire);
  formData.append("token", auth.token);

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  console.log("Bild URL:", data.url);

  // 👉 Beispiel: anzeigen
  const img = document.createElement("img");
  img.src = data.url;
  img.style.maxWidth = "200px";
  document.body.appendChild(img);
}
