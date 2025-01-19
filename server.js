const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios'); // 引入 axios
const { HttpsProxyAgent } = require('https-proxy-agent'); // 引入 https-proxy-agent 模块
const app = express();
const port = 3000;

// 允许跨域请求
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 解析 JSON 请求体
app.use(bodyParser.json());

// 删除文件的 API
app.post('/delete-file', (req, res) => {
    const { dirName, fileName } = req.body; // 从请求体中获取目录名称和文件名
    if (!dirName || !fileName) {
        return res.status(400).send('目录名称或文件名不能为空');
    }

    const filePath = path.join(__dirname, dirName, fileName); // 动态生成文件路径

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // 删除文件
        res.send(`文件删除成功: ${filePath}`);
    } else {
        res.send(`文件不存在: ${filePath}`);
    }
});

// 创建目录的 API
app.post('/create-directory', (req, res) => {
    const { dirName } = req.body; // 从请求体中获取目录名称
    if (!dirName) {
        return res.status(400).send('目录名称不能为空');
    }

    const dirPath = path.join(__dirname, dirName); // 动态生成目录路径
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }); // 创建目录（支持递归创建）
        res.send(`目录创建成功: ${dirPath}`);
    } else {
        res.send(`目录已存在: ${dirPath}`);
    }
});

// 删除目录的 API
app.post('/delete-directory', (req, res) => {
    const { dirName } = req.body; // 从请求体中获取目录名称
    if (!dirName) {
        return res.status(400).send('目录名称不能为空');
    }

    const dirPath = path.join(__dirname, dirName); // 动态生成目录路径
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true }); // 使用 fs.rmSync 删除目录（支持递归删除）
        res.send(`目录删除成功: ${dirPath}`);
    } else {
        res.send(`目录不存在: ${dirPath}`);
    }
});

// 递归删除上级空目录
function deleteEmptyParentDirectories(dirPath) {
    const parentDir = path.dirname(dirPath); // 获取上级目录
    if (parentDir === dirPath) {
        return; // 如果上级目录已经是根目录，则停止递归
    }

    // 检查上级目录是否为空
    if (fs.existsSync(parentDir) && fs.readdirSync(parentDir).length === 0) {
        fs.rmSync(parentDir, { recursive: true, force: true }); // 使用 fs.rmSync 删除空目录
        deleteEmptyParentDirectories(parentDir); // 递归检查上级目录
    }
}

// 删除目录及递归删除上级空目录的 API
app.post('/delete-directory-empty', (req, res) => {
    const { dirName } = req.body; // 从请求体中获取目录名称
    if (!dirName) {
        return res.status(400).send('目录名称不能为空');
    }

    const dirPath = path.join(__dirname, dirName); // 动态生成目录路径
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true }); // 使用 fs.rmSync 删除目录（支持递归删除）
        deleteEmptyParentDirectories(dirPath); // 检查并删除空的上级目录
        res.send(`目录删除成功: ${dirPath}`);
    } else {
        res.send(`目录不存在: ${dirPath}`);
    }
});

// 生成 .nfo 文件并保存到指定目录
app.post('/generate-nfo', (req, res) => {
    const { dirName, fileName, content } = req.body; // 从请求体中获取目录名称、文件名和内容
    if (!dirName || !fileName || !content) {
        return res.status(400).send('目录名称、文件名或内容不能为空');
    }

    const dirPath = path.join(__dirname, dirName); // 动态生成目录路径
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }); // 如果目录不存在，则创建
    }

    const filePath = path.join(dirPath, fileName); // 动态生成文件路径
    fs.writeFileSync(filePath, content, 'utf-8'); // 保存文件

    res.json({
        success: true,
        message: '文件保存成功',
        filePath: filePath
    });
});

// 生成 .strm 文件并保存到指定目录
app.post('/generate-strm', (req, res) => {
    const { dirName, fileName, content } = req.body; // 从请求体中获取目录名称、文件名和内容
    if (!dirName || !fileName || !content) {
        return res.status(400).send('目录名称、文件名或内容不能为空');
    }

    const dirPath = path.join(__dirname, dirName); // 动态生成目录路径
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }); // 如果目录不存在，则创建
    }

    const filePath = path.join(dirPath, fileName); // 动态生成文件路径
    fs.writeFileSync(filePath, content, 'utf-8'); // 保存文件

    res.json({
        success: true,
        message: '文件保存成功',
        filePath: filePath
    });
});

// 下载图片的 API
app.post('/download-image', async (req, res) => {
    const { dirName, imageUrl, imageName } = req.body; // 从请求体中获取目录名称、图片 URL、图片名称和 jav 参数
    if (!dirName || !imageUrl || !imageName) {
        return res.status(400).send('目录名称、图片 URL 或图片名称不能为空');
    }

    const dirPath = path.join(__dirname, dirName); // 动态生成目录路径
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }); // 如果目录不存在，则创建
    }

    const imagePath = path.join(dirPath, imageName); // 动态生成图片路径

    try {
        let response;
        if (imageUrl.includes('javbus')) {
            // 如果 jav 参数等于 'javbus'，则使用代理下载图片
            const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:7890'); // 使用 HTTP 代理
            response = await axios.get(imageUrl, {
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                    'Referer': 'https://www.javbus.com/',
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                },
                httpsAgent: proxyAgent, // 使用 HTTPS 代理
                timeout: 30000,
            });
        } else {
            // 否则，直接下载图片
            response = await axios.get(imageUrl, { responseType: 'stream' });
        }

        const writer = fs.createWriteStream(imagePath);

        response.data.pipe(writer);

        writer.on('finish', () => {
            res.json({
                success: true,
                message: '图片下载成功',
                imagePath: imagePath
            });
        });

        writer.on('error', (err) => {
            console.error('图片保存失败:', err);
            res.status(500).send('图片保存失败');
        });
    } catch (error) {
        console.error('图片下载失败:', error);
        res.status(500).send('图片下载失败');
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
