/* tslint:disable */

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
  }

const path = require('path')
const storage = require('azure-storage')

const blobService = storage.createBlobService()

const listContainers = async () => {
    return new Promise((resolve, reject) => {
        blobService.listContainersSegmented(null, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve({
                    message: `${data.entries.length} containers`,
                    containers: data.entries
                })
            }
        })
    })
}

const createContainer = async containerName => {
    return new Promise((resolve, reject) => {
        blobService.createContainerIfNotExists(
            containerName,
            { publicAccessLevel: 'blob' },
            err => {
                if (err) {
                    reject(err)
                } else {
                    resolve({ message: `Container '${containerName}' created` })
                }
            }
        )
    })
}

const uploadString = async (containerName, blobName, text) => {
    return new Promise((resolve, reject) => {
        blobService.createBlockBlobFromText(containerName, blobName, text, err => {
            if (err) {
                reject(err)
            } else {
                resolve({ message: `Text "${text}" is written to blob storage` })
            }
        })
    })
}

const uploadLocalFile = async (containerName, filePath) => {
    return new Promise((resolve, reject) => {
        const fullPath = path.resolve(filePath)
        const blobName = path.basename(filePath)
        blobService.createBlockBlobFromLocalFile(
            containerName,
            blobName,
            fullPath,
            err => {
                if (err) {
                    reject(err)
                } else {
                    resolve({ message: `Local file "${filePath}" is uploaded` })
                }
            }
        )
    })
}

const listBlobs = async containerName => {
    return new Promise((resolve, reject) => {
        blobService.listBlobsSegmented(containerName, null, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve({
                    message: `${data.entries.length} blobs in '${containerName}'`,
                    blobs: data.entries
                })
            }
        })
    })
}

const downloadBlob = async (containerName, blobName) => {
    const dowloadFilePath = path.resolve(
        './' + blobName.replace('.txt', '.downloaded.txt')
    )
    return new Promise((resolve, reject) => {
        blobService.getBlobToText(containerName, blobName, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve({ message: `Blob downloaded "${data}"`, text: data })
            }
        })
    })
}

const deleteBlob = async (containerName, blobName) => {
    return new Promise((resolve, reject) => {
        blobService.deleteBlobIfExists(containerName, blobName, err => {
            if (err) {
                reject(err)
            } else {
                resolve({ message: `Block blob '${blobName}' deleted` })
            }
        })
    })
}

const deleteContainer = async containerName => {
    return new Promise((resolve, reject) => {
        blobService.deleteContainer(containerName, err => {
            if (err) {
                reject(err)
            } else {
                resolve({ message: `Container '${containerName}' deleted` })
            }
        })
    })
}

const execute = async () => {
    const containerName = process.env.CONTAINER_NAME
    const localFilePath = process.env.FILE_PATH
    let response
    if (containerName == undefined || localFilePath || undefined) {
        console.log('$CONTAINER_NAMEと$FILE_PATHを設定してください。')
        return
    }

    console.log('Containers:')
    response = await listContainers()
    response.containers.forEach(container => console.log(` -  ${container.name}`))

    const containerDoesNotExist =
        response.containers.findIndex(
            container => container.name === containerName
        ) === -1

    if (containerDoesNotExist) {
        await createContainer(containerName)
        console.log(`Container "${containerName}" is created`)
    }

    response = await uploadLocalFile(containerName, localFilePath)
    console.log(response.message)
}

execute().then(() => console.log('Done')).catch(e => console.log(e))
