const fs = require('fs')
const path = require('path')
const { pipeline } = require('stream/promises')
const yauzl = require('yauzl-promise')

const RELEASES_URL = 'https://api.github.com/repos/pocketbase/pocketbase/releases/latest'
const ZIP_URL = (tagName) => `https://github.com/pocketbase/pocketbase/releases/download/${tagName}/pocketbase_${tagName.replace('v','')}_linux_amd64.zip`
const OUT_PATH = path.resolve(__dirname, '../pocketbase')

const update = async () => {
  const { tag_name } = await (await fetch(RELEASES_URL)).json()

  console.log('Downloading latest release:', tag_name)

  const zipBuffer = await (await fetch(ZIP_URL(tag_name))).arrayBuffer()
  const zip = await yauzl.fromBuffer(Buffer.from(zipBuffer))

  for await (const entry of zip) {
    if (entry.filename === 'pocketbase') {
      console.log('Extracting:', entry.filename)

      const readStream = await entry.openReadStream()
      const writeStream = fs.createWriteStream(OUT_PATH)

      await pipeline(readStream, writeStream)
    }
  }

  await fs.promises.chmod(OUT_PATH, '755')
  await zip.close()

  console.log('Done')
}

update()
