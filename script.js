const fs = require('fs');
const path = require('path');

const generateFolderStructure = (tableName) => {
    const folders = ['controllers', 'models', 'services', 'routes'];
    folders.forEach(folder => {
        const dir = path.join(__dirname, `./${tableName}/${folder}`);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};


const generateModel = (tableName, columns) => {
    const modelTemplate = `
        const mongoose = require('mongoose');
        const ${tableName}Schema = new mongoose.Schema({
            ${columns.map(column => `${column.name}: ${column.type}`).join(',\n')}
        }, {timestamps: true});
        const ${tableName}Model = mongoose.model('${tableName}', ${tableName}Schema);
        module.exports = ${tableName}Model;
    `;
    const filePath = path.join(__dirname, `./${tableName}/models/${tableName}.js`);
    fs.writeFileSync(filePath, modelTemplate);
};



const generateService = (tableName) => {
    const serviceTemplate = `
        const ${tableName}Model = require('../models/${tableName}');
        
        class ${tableName}Service {
            async create(data) {
               try{
                    const ${tableName.toLowerCase()} = new ${tableName}Model(data);
                    await ${tableName.toLowerCase()}.save();

                    return ${tableName.toLowerCase()};
               }catch(err){
                    throw err;
               }
            }

            async getAll() {
                try{
                    const ${tableName.toLowerCase()} = await ${tableName}Model.find({});
                    return ${tableName.toLowerCase()};
                }catch(err){
                    throw err;
                }
            }

            async getById(id) {
                try{
                    const ${tableName.toLowerCase()} = await ${tableName}Model.findById(id);
                    return ${tableName.toLowerCase()};
                }catch(err){
                    throw err;
                }
            }

            async updateById(id, data) {
                try{
                    const updated = await ${tableName}Model.findByIdAndUpdate(id, data, { new: true });
                    if (!updated) {
                        throw new Error('Not Found');
                    }
                    return updated;
                }catch(err){
                    throw err;
                }
            }

            async deleteById(id) {
                try{
                    const deleted = await ${tableName}Model.findByIdAndDelete(id);
                    if (!deleted) {
                        throw new Error('Not Found');
                    }
                }catch(err){
                    throw err;
                }
            }
        }

        module.exports = new ${tableName}Service();
    `;

    const filePath = path.join(__dirname, `./${tableName}/services/${tableName}Service.js`);
    fs.writeFileSync(filePath, serviceTemplate);
};


const generateController = (tableName) => {
    const controllerTemplate = `
        const ${tableName}Service = require('../services/${tableName}Service');
        const ${tableName}Model = require('../models/${tableName}');
        
        class ${tableName}Controller {
            async create(req, res) {
                try{
                    const ${tableName.toLowerCase()} = await ${tableName}Service.create(req.body);
                    res.status(201).json(${tableName.toLowerCase()});
                }catch(err){
                    res.status(400).json({ message: err.message });
                }
            }

            async getAll(req, res) {
                try{
                    const ${tableName.toLowerCase()} = await ${tableName}Service.getAll();
                    res.status(200).json(${tableName.toLowerCase()});
                }catch(err){
                    res.status(400).json({ message: err.message });
                }
            }

            async getById(req, res) {
                try{
                    const ${tableName.toLowerCase()} = await ${tableName}Service.getById(req.params.id);
                    res.status(200).json(${tableName.toLowerCase()});
                }catch(err){
                    res.status(400).json({ message: err.message });
                }
            }

            async updateById(req, res) {
                try{
                    const updated = await ${tableName}Service.updateById(req.params.id, req.body);
                    res.status(200).json(updated);
                }catch(err){
                    res.status(400).json({ message: err.message });
                }
            }

            async deleteById(req, res) {
                try{
                    await ${tableName}Service.deleteById(req.params.id);
                    res.status(204).json({});
                }catch(err){
                    res.status(400).json({ message: err.message });
                }
            }

            async getAll(reqm, res) {
                const page = parseInt(req.body.currentPageIndex) || 1;
                const filters = req.body.filters || {};
        
                const itemsPerPage = req.body.dataPerPage;
                const skip = (page - 1) * itemsPerPage;

                try{
                    let query = {}

                    if(filters){
        
                    }

                    const items = await ${tableName}Model.find(query)
                                        .skip(skip)
                                        .limit(itemsPerPage)
                                        .sort({'updatedAt' : -1})

                    const totalItems = await ${tableName}Model.countDocuments(query);

                    let response = {}

                    if(items.length === 0){
                        response = {
                            data: items,
                            dataCount: totalItems,
                            currentPaginationIndex: page,
                            dataPerPage: itemsPerPage,
                            message: 'There are not matching records.'
                        }
                    }else{
                        response = {
                            data: items,
                            dataCount: totalItems,
                            currentPaginationIndex: page,
                            dataPerPage: itemsPerPage,
                            message: 'Data returned'
                        }
                    }

                    res.json(response);
                }catch(error){
                    res.status(500).send({error: 'Internal Server Error'})
                }
            }
        }

        module.exports = new ${tableName}Controller();
    `;
    const filePath = path.join(__dirname, `./${tableName}/controllers/${tableName}Controller.js`);
    fs.writeFileSync(filePath, controllerTemplate);
};


const generateRoute = (tableName) => {
    const routeTemplate = `
        const express = require('express');
        const router = express.Router();
        const ${tableName}Controller = require('../controllers/${tableName}Controller');
        
        router.post('/', ${tableName}Controller.create);
        router.get('/', ${tableName}Controller.getAll);
        router.get('/:id', ${tableName}Controller.getById);
        router.put('/:id', ${tableName}Controller.updateById);
        router.delete('/:id', ${tableName}Controller.deleteById);
        
        module.exports = router;
    `;
    const filePath = path.join(__dirname, `./${tableName}/routes/${tableName}Routes.js`);
    fs.writeFileSync(filePath, routeTemplate);
};



const generateCRUDApp = (json) => {
    const { tableName, columns } = json;
    generateFolderStructure(tableName);
    generateModel(tableName, columns);
    generateController(tableName);
    generateService(tableName);
    generateRoute(tableName);
};


const json = require('./table.json');

generateCRUDApp(json);
