const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const hybridAuth = require('../middlewares/hybridAuth.middleware');
const upload = require('../middlewares/uploadProfile.middleware');
const {
  authenticateAdmin,
  authorizeRole,
} = require('../middlewares/admin.middleware');



//#region Dashboard
router.patch('/inactivate-all',authenticateAdmin, authorizeRole(`super`,`regular`), controller.inActivateAllUsers);

router.patch('/inactivate-selectedUsers',authenticateAdmin, authorizeRole(`super`,`regular`), controller.inActivateSelectedUsers);

router.patch('/activate-all',authenticateAdmin, authorizeRole(`super`,`regular`), controller.ActivateAllUsers);

router.patch('/activate-selectedUsers',authenticateAdmin, authorizeRole(`super`,`regular`), controller.ActivateSelectedUsers);

router.delete('/delete-all',authenticateAdmin, authorizeRole(`super`,`regular`), controller.deleteAllUsers);

router.delete('/delete-selectedUsers',authenticateAdmin, authorizeRole(`super`,`regular`), controller.deleteSelectedUsers);

router.get('/', authenticateAdmin, authorizeRole(`super`,`regular`), controller.getAll);

router.post('/',authenticateAdmin,authorizeRole(`super`,`regular`), controller.create);

router.patch('/update-user/:id',authenticateAdmin, authorizeRole(`super`,`regular`), controller.updateUser);

//#endregion


//#region Mobile App
// router.post('/upload-profile', hybridAuth, upload.single('profileImage'), controller.uploadProfileImage);
router.post(
  '/upload-profile',
  upload.single('profileImage'),  // multer الأول
  hybridAuth,                     // بعده الـ auth
  controller.uploadProfileImage
);
// router.post(
//   "/upload-profile",
//   upload.single("profileImage"),
//   (req, res) => {
//     console.log("Body:", req.body);
//     console.log("File:", req.file);
//     res.json({ body: req.body, file: req.file });
//   }
// );

// مؤقت لِ debugging — استعمله بدل الراوت الحالي
// router.post(
//   "/upload-profile",
//   (req, res, next) => {
//     console.log('--- incoming request headers ---');
//     console.log('content-type:', req.headers['content-type']);
//     console.log('method:', req.method);
//     next();
//   },
//   upload.single('profileImage'),
//   (req, res) => {
//     console.log('--- after multer ---');
//     console.log('req.body keys:', Object.keys(req.body || {}));
//     console.log('req.file:', req.file); // <-- هنا نحتاج اللوج
//     res.json({ ok: true, filePresent: !!req.file });
//   }
// );



router.get('/:firebase_uid',hybridAuth, controller.getById);

router.patch('/:firebase_uid',hybridAuth, controller.update);

router.patch('/updateAfterRegister/:firebase_uid', controller.updateAfterRegister);

router.delete('/:firebase_uid',hybridAuth, controller.delete);

//#endregion













module.exports = router;
