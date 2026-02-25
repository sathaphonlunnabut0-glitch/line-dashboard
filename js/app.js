const { createClient } = supabase

const supabaseClient = createClient(
  "https://sghljaxzdbiwfihkjvdp.supabase.co",
  "sb_publishable_zI0MUYAb5ZeYIEvtwl4D3A_2VpPYqjk"
)

let currentUser = null

// =============================
// INIT
// =============================
window.addEventListener("load", async () => {
  const { data: { session } } = await supabaseClient.auth.getSession()
  if (session) showDashboard(session.user)
})

// =============================
// AUTH
// =============================
registerBtn.onclick = async () => {
  const { error } = await supabaseClient.auth.signUp({
    email: email.value,
    password: password.value
  })
  status.innerText = error ? error.message : "สมัครสำเร็จ!"
}

loginBtn.onclick = async () => {
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })
  if (error) status.innerText = error.message
  else location.reload()
}

logoutBtn.onclick = async () => {
  await supabaseClient.auth.signOut()
  location.reload()
}

// =============================
// DASHBOARD
// =============================
function showDashboard(user) {
  currentUser = user
  authSection.style.display = "none"
  dashboard.style.display = "block"
  userEmail.innerText = "Email: " + user.email
  loadAllFiles()
}

async function loadAllFiles() {
  const fileList = document.getElementById("fileList")
  fileList.innerHTML = "กำลังโหลด..."

  let totalFiles = 0
  fileList.innerHTML = ""

  const folders = ["image", "video", "audio", "file"]

  for (const folder of folders) {
    const { data, error } = await supabaseClient
      .storage
      .from("line-files")
      .list(folder)

    if (error || !data) continue

    data.forEach(file => {
      totalFiles++

      const fullPath = folder + "/" + file.name

      const { data: publicUrlData } = supabaseClient
        .storage
        .from("line-files")
        .getPublicUrl(fullPath)

      const publicUrl = publicUrlData.publicUrl

      const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)

      fileList.innerHTML += `
        <div class="file-card">
          <p>${fullPath}</p>
          ${isImage ? `<img src="${publicUrl}">` : `<p>📄 File</p>`}
          <div class="actions">
            <button onclick="downloadFile('${publicUrl}', '${file.name}')">
              Download
            </button>
            <button class="delete-btn" onclick="deleteFile('${fullPath}')">
              Delete
            </button>
          </div>
        </div>
      `
    })
  }

  document.getElementById("fileCount").innerText = totalFiles

  if (totalFiles === 0) {
    fileList.innerHTML = "ยังไม่มีไฟล์"
  }
}

// =============================
// DOWNLOAD (PRO VERSION)
// =============================
async function downloadFile(url, filename) {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error("Network error")

    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = blobUrl
    link.download = filename

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    window.URL.revokeObjectURL(blobUrl)
  } catch (err) {
    alert("ดาวน์โหลดไม่สำเร็จ")
    console.error(err)
  }
}

// =============================
// DELETE
// =============================
async function deleteFile(path) {
  if (!confirm("ต้องการลบไฟล์นี้ใช่ไหม?")) return

  const { error } = await supabaseClient
    .storage
    .from("line-files")
    .remove([path])

  if (error) {
    alert("ลบไม่สำเร็จ")
  } else {
    loadAllFiles()
  }
}
