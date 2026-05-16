const { initializeApp } = require('firebase-admin/app')
const { cleanupExpiredVideos } = require('./src/cleanupExpiredVideos')
const { createUser } = require('./src/createUser')

initializeApp()

exports.cleanupExpiredVideos = cleanupExpiredVideos
exports.createUser = createUser
