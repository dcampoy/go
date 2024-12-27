export async function drawHelp(overlay: HTMLDivElement) {
  const overlayContent = document.createElement("div")
  overlayContent.style.display = "flex"
  overlayContent.style.fontFamily = "sans-serif"
  overlayContent.style.flexDirection = "column"
  overlayContent.style.gap = "10px"
  overlayContent.style.padding = "20px"
  overlayContent.style.border = "1px solid #ccc"
  overlayContent.style.borderRadius = "10px"
  overlayContent.style.boxShadow = "0 0 10px 0 rgba(0, 0, 0, 0.1)"
  overlayContent.style.width = "100%"
  overlayContent.style.maxWidth = "512px"
  overlayContent.style.color = "white"
  overlayContent.style.backdropFilter = "blur(10px)"
  overlay.innerHTML = ""
  overlay.appendChild(overlayContent)

  const title = document.createElement("div")
  title.style.fontSize = "1.5em"
  title.style.fontWeight = "bold"
  title.style.letterSpacing = "0.1em"
  title.textContent = "Keyboard shortcuts"
  overlayContent.appendChild(title)

  const keys = [
    { label: "F1 or ?", description: "Show keyboard shortcuts" },
    { label: "S", description: "Estimate score" },
    { label: "E", description: "Export to NN" },
    { label: "P", description: "Pass turn" },
    { label: "←", description: "Undo" },
    { label: "→", description: "Redo" },
  ]

  const table = document.createElement("table")
  table.style.width = "100%"
  table.style.borderCollapse = "collapse"
  const tbody = document.createElement("tbody")
  table.appendChild(tbody)

  keys.forEach((key) => {
    const tr = document.createElement("tr")
    const th = document.createElement("th")
    th.style.textAlign = "left"
    th.style.fontWeight = "bold"
    th.textContent = key.label
    const td = document.createElement("td")
    td.style.textAlign = "left"
    td.style.fontWeight = "lighter"
    td.textContent = key.description
    tr.appendChild(th)
    tr.appendChild(td)
    tbody.appendChild(tr)
  })

  overlayContent.appendChild(table)

  overlay.style.display = "flex"
}

export async function hideOverlay(overlay: HTMLDivElement) {
  overlay.style.display = "none"
  overlay.innerHTML = ""
}
