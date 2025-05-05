/**
 * FileSaver.js
 * A saveAs() FileSaver implementation.
 *
 * Modified for use in this project.
 */
export function saveAs(blob: Blob, name: string) {
  // Create a link element
  const link = document.createElement("a")

  // Set link's href to point to the Blob
  link.href = URL.createObjectURL(blob)

  // Set the download attribute to the desired filename
  link.download = name

  // Append link to the body
  document.body.appendChild(link)

  // Dispatch click event on the link
  link.click()

  // Remove link from the body
  document.body.removeChild(link)

  // Release the object URL
  setTimeout(() => {
    URL.revokeObjectURL(link.href)
  }, 100)
}
