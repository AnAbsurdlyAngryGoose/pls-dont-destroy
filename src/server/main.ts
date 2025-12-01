import express from "express";
import {
    createServer,
    getServerPort
} from "@devvit/web/server";
import {
    onCommentCreate,
    onCommentDelete,
    onPostCreate,
    onPostDelete
} from "./triggers/index.js";
import {
    checkSubstitutions,
    isNaturalNumber,
    isUUID
} from "./validations/index.js";
import {
    checkForUpdates,
    cleanupData
} from "./tasks/index.js";

const application = express();
application.use(express.json());
application.use(express.urlencoded({ extended: true }));
application.use(express.text());

const router = express.Router();
router.post('/internal/triggers/comment-create', onCommentCreate);
router.post('/internal/triggers/post-create', onPostCreate);
router.post('/internal/triggers/comment-delete', onCommentDelete);
router.post('/internal/triggers/post-delete', onPostDelete);
router.post('/internal/validations/check-substitutions', checkSubstitutions);
router.post('/internal/validations/is-natural-number', isNaturalNumber);
router.post('/internal/validations/is-uuid', isUUID);
router.post('/internal/tasks/cleanup-data', cleanupData);
router.post('/internal/tasks/check-for-updates', checkForUpdates);

application.use(router);

const server = createServer(application);
server.on("error", (err) => { console.error(`server error; ${err.stack}`); });

const port = getServerPort();
server.listen(port);
