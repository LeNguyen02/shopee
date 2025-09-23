const express = require('express')
const { requireAdmin } = require('../middleware/adminAuth')
const Banner = require('../models/Banner')
const { uploadBannerImage } = require('../middleware/uploadBanner')

const router = express.Router()

// Public: list banners (optionally by position)
router.get('/', async (req, res) => {
  try {
    const position = req.query.position || 'main'
    const onlyActive = req.query.all === '1' ? false : true
    const banners = await Banner.findAll({ position, onlyActive })
    res.json({ message: 'Lấy banners thành công', data: banners })
  } catch (error) {
    console.error('Get banners error:', error)
    res.status(500).json({ message: 'Lỗi server', data: null })
  }
})

// Admin: upload + create banner
router.post('/', requireAdmin, (req, res) => {
  uploadBannerImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Lỗi upload hình ảnh: ' + err.message, data: null })
    }
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Không có file được chọn', data: null })
      }
      const { link, position = 'main', sort_order = 0, is_active = 1 } = req.body
      const imagePath = `/uploads/banners/${req.file.filename}`
      const created = await Banner.create({ image: imagePath, link: link || null, position, sort_order: Number(sort_order) || 0, is_active: Number(is_active) ? 1 : 0 })
      res.json({ message: 'Tạo banner thành công', data: created })
    } catch (e) {
      console.error('Create banner error:', e)
      res.status(500).json({ message: 'Lỗi server', data: null })
    }
  })
})

// Admin: delete banner
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Banner.delete(req.params.id)
    res.json({ message: 'Xóa banner thành công', data: null })
  } catch (e) {
    console.error('Delete banner error:', e)
    res.status(500).json({ message: 'Lỗi server', data: null })
  }
})

module.exports = router


