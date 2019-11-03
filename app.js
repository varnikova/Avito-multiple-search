var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(express.static('public'));
app.set('port', process.env.PORT || 80);
var jsonfile = require('jsonfile');
app.use(bodyParser.json());
var request = require('request'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    path = require('path'),
    res_arr = [],
    ind = 0,
    count_posts = 1;

let server = app.listen(app.get('port'), function(){                                        //identification


    console.log('Сервер запущен на  http://localhost:' + app.get('port') + '  Ctrl-C to terminate');
});

app.post('/ResArr/', function(req, res) {
    news_base_url=req.body.Name+"&view=gallery";
    restrict=req.body.Restrict; //взяла условие из запроса
    console.log(news_base_url);
   get_page_content(news_base_url + 0, 0 );

    function get_page_content( url, i,) {
        request(url, function ( error, response, body ) {

            if( !error ) {
                //console.log(body);
                var $ = cheerio.load(body),
                    newses = $('.item');

                newses.each(function () {
                    var self = $(this),

                        cont = self.find('.item__line');
                    var title;
                    var temp;
                    var end=false;
                    cont.find('span').each(function () {
                        if ($(this)[0].children[0])
                            if($(this)[0].children[0].data!=="В избранное" && $(this)[0].children[0].data!== '') { //находим название
                                //console.log($(this)[0].children[0].data);
                                // console.log("_______________________________")
                                temp+=$(this)[0].children[0].data;
                                if(temp.indexOf(restrict) + 1){
                                    title+=$(this)[0].children[0].data;
                                }

                                end=true;

                            }

                    });
                    if(end) {
                        link= "https://www.avito.ru" + cont.find('a').attr('href');
                        var title=title.replace("undefined",""); // Сломалось - Cannot read property 'replace' of undefined
                        res_arr[ind] = {
                            title: title,
                            link: "https://www.avito.ru" + cont.find('a').attr('href'),
                            img1 : cont.find('img').attr('src'),
                            img2: cont.find('img').attr('data-srcpath'),
                            content:""
                        }

                    }
                    get_post_content(link, ind);

                    ind++;
                });
                //console.log(res_arr);


            } else {
                console.log("Произошла ошибка: " + error);
            }
        });


    }

// Получение контента
    function get_post_content( link, array_index ) {
        request(link, function (error, response, body) {
            if (res_arr[array_index])
                if (!error) {
                    var $ = cheerio.load(body, {decodeEntities: false});
                    //console.log($('.item-description').html())
                    res_arr[array_index].content = $('.item-description').html();


                } else {
                    console.log("Произошла ошибка: " + error);
                }
            console.log(count_posts)
            console.log(res_arr.length)
            if (count_posts++ ==res_arr.length) {

                res.send(res_arr)
                //write_parse_res( file_json, JSON.stringify(res_arr) );
            }
        })
    }
});


// Имя файла в той же папке, где лежит файл скрипта
var file_json = path.resolve(__dirname, 'parse_file.json');


// Сохранение на диск
function write_parse_res( file_json, str ) {
    fs.writeFile(file_json, str, function ( err ) {
        if( err ) {
            console.log(err);
        } else {
            console.log('Добавил все');
        }
    });
}