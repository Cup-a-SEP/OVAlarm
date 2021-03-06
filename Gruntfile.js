/**
    *  (The MIT License)
    *    Copyright (c) 2013 Calendar42 &lt;bob@calendar42.com&gt;
    *
    *    Permission is hereby granted, free of charge, to any person obtaining
    *    a copy of this software and associated documentation files (the
    *    'Software'), to deal in the Software without restriction, including
    *    without limitation the rights to use, copy, modify, merge, publish,
    *    distribute, sublicense, and/or sell copies of the Software, and to
    *    permit persons to whom the Software is furnished to do so, subject to
    *    the following conditions:
    *
    *    The above copyright notice and this permission notice shall be
    *    included in all copies or substantial portions of the Software.
    *
    *    THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
    *    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    *    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    *    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
    *    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    *    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    *    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        less: {
            development: {
                options: {
                    relativeUrls: true,
                    // paths: ["assets/css"]
                },
                files: {
                    "platforms/android/assets/www/css/main.css": "www/less/main.less",
                    "platforms/ios/www/css/main.css": "www/less/main.less",
                }
            },
            // production: {
            //     options: {
            //         paths: ["assets/css"],
            //         cleancss: true
            //     },
            //     files: {
            //         "path/to/result.css": "path/to/source.less"
            //     }
            // }
        },

        clean_after_prepare: {
            options: {
                cwd: 'www',
                htmlFile: 'index.html',
                alwaysInclude: ['index.html', 'config.xml', 'img/**', 'js/config/**', 'fonts/**', 'js/**', 'tpl/**'],
                foldersToClean: ['platforms/android/assets/www/', 'platforms/ios/www/']
            }
        }
    });
    
    // Load Tasks
    grunt.loadNpmTasks("grunt-contrib-less");

    // Register Tasks
    grunt.registerTask('default', ['jshint']);
    grunt.registerTask('after_prepare', ['less']);

    // TODO: Make this available on Github of Calendar42 and import from there
    grunt.registerTask('clean_after_prepare', 'After cordova prepare', function() {
        // Force task into async mode and grab a handle to the "done" function.
        var done = this.async();

        var path    = require('path');
        var cheerio = require('cheerio');

        grunt.log.writeln('Currently running the "after_prepare" task.');

        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            'cwd': 'www',
            'htmlFile': 'index.html',
            'alwaysInclude': [],
            'foldersToClean': []
        });


        function findIncludesFromHTML (htmlFile, cbFindIncludes) {
            var data = grunt.file.read(htmlFile);

            $ = cheerio.load(data);

            var includedFiles = [];

            $('script,link[rel="stylesheet"][type="text/css"]').each(function() {
                var el = $(this);
                var src = null;

                if (el.attr('dev') === 'true') {
                    el.remove();
                } else {
                    if (el.is('script')) {
                        src = el.attr('src');
                    } else if (el.is('link')) {
                        src = el.attr('href');
                    }

                    if (src) {
                        includedFiles.push(src);
                    }
                }
            });

            // Remove the less includes
            $('link[rel="stylesheet/less"]').each(function() {
                var el = $(this);
                el.remove();
            });
            
            // Save changed indexFiles
            grunt.file.write('platforms/android/assets/www/index.html', $.html());
            grunt.file.write('platforms/ios/www/index.html', $.html());
            grunt.log.writeln('Saved the different files');

            cbFindIncludes(null, includedFiles);
        }
        
        function getFilesToKeep (files) {
            return grunt.file.expand({
                'cwd': options.cwd,
                'dot': true,
                'filter': 'isFile'
            }, files.concat(options.alwaysInclude));
        }

        function getFilesToDelete (filesToKeep) {
            return grunt.file.expand({
                'cwd': options.cwd,
                'dot': true,
                'filter': function(filepath) {
                    // Get all files that are not in filesToKeep
                    return grunt.file.isFile(filepath) && filesToKeep.indexOf(path.relative(options.cwd, filepath)) === -1;
                }
            }, ['**']);
        }

        function hasFiles (folderpath) {
            var files = grunt.file.expand({
                'cwd': folderpath,
                'dot': true,
                'filter': 'isFile'
            }, ['**', '!.DS_Store']);
            return files.length > 0;
        }

        function cleanFolders (toDelete, cbCleanFolders) {
            options.foldersToClean.forEach(function (folder) {
                toDelete.forEach(function (fileToDelete) {
                    var fullPath = path.join(folder, fileToDelete);
                    if (grunt.file.exists(fullPath)) {
                        // console.warn('delete:', fullPath);
                        grunt.file.delete(fullPath);
                    }
                });
            });
            cbCleanFolders();
        }

        function removeEmptyFolders (cbRemoveEmpty) {
            options.foldersToClean.forEach(function (folder) {
                var folders = grunt.file.expand({
                    'cwd': folder,
                    'dot': true,
                    'filter': function (filepath) {
                        return grunt.file.isDir(filepath) && filepath !== folder;
                    }
                }, ['**']);

                folders.forEach(function (folderToDelete) {
                    var fullPath = path.join(folder, folderToDelete);

                    if (grunt.file.exists(fullPath) && !hasFiles(fullPath)) {
                        // console.warn('delete empty folder:', fullPath);
                        grunt.file.delete(fullPath);
                    }
                });
            });
            cbRemoveEmpty();
        }

        findIncludesFromHTML(path.join(options.cwd, options.htmlFile), function (err, files) {
            if (err) {
                done(false);
            }

            var toKeep = getFilesToKeep(files);
            // console.warn('TO KEEP', toKeep);

            var toDelete = getFilesToDelete(toKeep);
            // console.warn('TO DELETE', toDelete);

            cleanFolders(toDelete, function () {
                removeEmptyFolders(function () {
                    done();
                });
            });
        });
    });

};