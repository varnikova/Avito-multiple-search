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
let random=null;
min = 1000; //в продакшн 5000
max = 6000; //не меньше 50000


let server = app.listen(app.get('port'), function(){                                        //identification


    console.log('Сервер запущен на  http://localhost:' + app.get('port') + '  Ctrl-C to terminate');
});

app.post('/ResArr/', function(req, res) {
   // news_base_url=req.body.Name;
    news_base_url=req.body.Name+"&view=gallery"; //учесть что вид бывает галерея и нет
    restrict=req.body.Restrict; //взяла условие из запроса
    badrestrict=req.body.BadRestrict;
    let restricts=restrict.split('%');
    let badrestricts=badrestrict.split('%');
    let suited=false;
    console.log(news_base_url);
   get_page_content(news_base_url + 0, 0 );
   let short_url=news_base_url.replace('https://www.avito.ru', '');

    let options = {
        url: short_url,
        headers: { // Warning! refer from spb
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'cache-control':' max-age=0',
            'cookie':' u=2fqxwla0.14n1lhd.g7s488jsve; buyer_selected_search_radius4=0_general; __cfduid=d99ff3c2323834d751575321677a31d961570616225; _ga=GA1.2.175421165.1570616231; buyer_tooltip_location=0; _ym_uid=1570616232899017785; _ym_d=1570616232; _fbp=fb.1.1570616233519.1162486641; buyer_popup_location=653240; abp=2; __gads=ID=01081209e0ca6a0a:T=1572839409:S=ALNI_MY7jgFC11AVhE0P6i_ltkMlo0d7rw; _nfh=8c3cc2deaf3e662199b1e622dbe03b02; view=gallery; buyer_location_id=653240; sessid=92e9ee0a477ce9961208f4cff4d79f39.1573007987; v=1573007987; luri=sankt-peterburg; dfp_group=4; _gid=GA1.2.2006031881.1573007991; f=5.32e32548b6f3e9784b5abdd419952845a68643d4d8df96e9a68643d4d8df96e9a68643d4d8df96e9a68643d4d8df96e94f9572e6986d0c624f9572e6986d0c624f9572e6986d0c62ba029cd346349f36c1e8912fd5a48d02c1e8912fd5a48d0246b8ae4e81acb9fa143114829cf33ca746b8ae4e81acb9fa46b8ae4e81acb9fae992ad2cc54b8aa8b175a5db148b56e9bcc8809df8ce07f640e3fb81381f3591fed88e598638463b2da10fb74cac1eab2da10fb74cac1eab2da10fb74cac1eab2da10fb74cac1eab2da10fb74cac1eab2da10fb74cac1eab2da10fb74cac1eab2da10fb74cac1eab2da10fb74cac1eab2da10fb74cac1eab2da10fb74cac1eab2da10fb74cac1eabfdb229eec3b9ed9a0c79affd4e5f1d11162fe9fd7c8e976774740f960ca8325a5abd6b432aa1e08d5e61d702b2ac73f790a042de6ed0741d230c40ac510863bf61da5109fec5256288ccc449ccef517f8732de926882853a9d9b2ff8011cc827c4d07ec9665f0b70915ac1de0d034112ffa066498e9dae8a16a26f04a98f8b0d2da10fb74cac1eab2da10fb74cac1eab2c951d5df734fbe304aa2bcefe8506e0845a8aa72c58074e; _ym_visorc_34241905=b; _dc_gtm_UA-2546784-1=1; _ym_visorc_106253=w; _ym_isad=1; _ym_visorc_188382=w; _ym_visorc_189903=w; sx=H4sIAAAAAAACAwXBMQ6AIAwAwL90doBQEPkNAWlMhxJrYCD83bsFdeSOIwRfeSIxo8wZKRqBtGBAgkdbf20e7UMkQaZSopCKstIsDAfckKw%2FnbkQjdv7B8b73DhUAAAA; so=1573008000; buyer_from_page=catalog',
            'referer': 'https://www.avito.ru',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36'
        }
    };

    function get_page_content( url, i,) {
        request(url, function ( error, response, body ) {
            if( !error ) {
                //console.log(body);
                var $ = cheerio.load(body),
                    newses = $('.item');
                if (newses.length==0) {console.log("Ничего не найдено либо выдали бан");}

                newses.each(function () {
                    var self = $(this),
                    cont = self.find('.item__line'); //находим объявление
                    var title;
                    var price;
                    var temp=false;
                    var end=false;
                    /*cont.find('span').each(function () {
                        if ($(this)[0].children[0])
                            if($(this)[0].children[0].data!=="В избранное" && $(this)[0].children[0].data!== '') { //находим название товара
                                //console.log($(this)[0].children[0].data);
                                // console.log("_______________________________")
                                    title+=$(this)[0].children[0].data;
                                    end=true;
                            }

                    });*/
                    console.log("desc "+ cont.find('.description')[0]);
                    cont.find('.description').each(function () {
                        //console.log('зашли в описание')
                         title = $(this).find('.snippet-link')[0].children[0].data;
                         price = $(this).find('.price')[0].children[0].data;
                        console.log(title +" "+ price);
                        if(title && price){
                            // console.log(title +" "+ price);
                            end=true;
                        }
                        //console.log($(this)[0].data);
                    /*    if ($(this)[0].children[0])
                            if($(this)[0].children[0].data!==''  && $(this)[0].children[0].data!==' ') { //находим название товара
                                //console.log($(this)[0].children[0].data);
                                // console.log("_______________________________")

                            }*/

                    });
                    if(end) {

                        restricts.forEach(function(r) { //ищем хотя бы одно из плюс слов в названии
                            if(title.indexOf(r)+1) {
                              suited=true;
                              return suited;
                            }
                        });
                        badrestricts.forEach(function(br) { //ищем хотя бы одно из минус слов в названии
                            if(title.indexOf(br)+1) {
                                suited=false;
                                return suited;
                            }
                        });
                        link= "https://www.avito.ru" + cont.find('a').attr('href');
                        var title=title.replace("undefined","");
                        res_arr[ind] = {
                            title: title,
                            link: "https://www.avito.ru" + cont.find('a').attr('href'),
                            img1 : cont.find('img').attr('src'),
                            img2: cont.find('img').attr('data-srcpath'),
                            content:""
                            }
                            //случайная пауза перед заходом в объявление
                        const postpause = min + Math.random() * (max - min);
                        setTimeout(get_post_content, postpause, link, ind);
                        //get_post_content(link, ind);
                        ind++;
                    }
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
                    res_arr[array_index].content = $('.item-description').html(); //item-address__string
                    res_arr[array_index].adress = $('.item-address__string').text();
                    restricts.forEach(function(r) { //ищем хотя бы одно из поисковых слов в названии
                        if(res_arr[array_index].content.indexOf(r)+1) {
                            suited=true;
                            return suited;
                        }
                    });
                    badrestricts.forEach(function(br) { //ищем хотя бы одно из минус слов в названии
                        if(res_arr[array_index].content.indexOf(br)+1) {
                            suited=false;
                            return suited;
                        }
                    });
                } else {
                    console.log("Произошла ошибка: " + error);
                }
           /* console.log(count_posts)
            console.log(res_arr.length)*/
            if (count_posts++ ==res_arr.length && suited) {

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