const { App } = require('@slack/bolt');
const fs = require('fs');

require('date-utils');

const weather = require('./weatherFunc');

// Initializes your app with your bot token and signing secret
const SLACK_BOT_TOKEN = "xoxb-?";
const USER_TOKEN = "xoxp-?";
//const SLACK_SIGNING_SECRET = "?";
const APP_TOKEN = "xapp-?";

const data_pass = "./data.txt";


const MY_WEATHER_APIKEY = "?";


const app = new App({
  token: SLACK_BOT_TOKEN,
  //signingSecret: SLACK_SIGNING_SECRET,
  appToken: APP_TOKEN,
  socketMode: true
});


var date = new Date();
var start_date = date.toFormat("YYYY/MM/DD HH24:MI:SS");


var users_score = {};
var users_name = {};

var game_mode = 0;
var GAME_KAZUATE = 1;
var GAME_JANKEN= 2;
var GAME_MINES = 3;
var GAME_BOMB = 4;
var GAME_BOMB2 = 5;

var kazuate_turns=0;
var kazuate_ans = 0;
var mines_turns = 0;
var mines_matrix = new Array(9);
var mines_display = new Array(2+9);
var mines_matrixNumberd = new Array(2+9);

const BOMB_MAX = 4;
var bomb_players = [];
var bomb_passing = [];
var bomb_length = 0;
var bomb_current=0;

const BOMB2_MAX = 4;
var bomb2_players = [];
var bomb2_passing = [];
var bomb2_length = 0;
var bomb2_current=0;
var bomb2_stage = 0;
var bomb2_loser = [];



data_load();



//メイン処理
app.message('', async ({ message, say }) => 
{
    let msg = message.text;
    let mode = game_mode;

    if (msg.indexOf("[nop]")　!==-1) return;

    users_set(message.user);

    if (msg==="ゲーム停止") 
    {
        await say("進行中のゲームを中止しました");
        game_mode = 0;
        return;
    }

    if (msg.indexOf("ダークライ")!==-1)
    {
        await say(`ダークライさん(起動: ${start_date})、ただいま正常に稼働しています`);
    }

    
    if (msg.indexOf("得点開示")!==-1)
    {
        await say(users_score_text());
    }

    if (msg.indexOf("ユーザーID")!==-1)
    {
        await say(`<@${message.user}> さんのユーザーIDは ${message.user} です`);
    }
    
    //ユーザー登録
    if (msg.indexOf("ユーザー登録 ")!==-1)
    {
        const id = `${message.user}`;
        let name = msg.replace('ユーザー登録 ', '');
        name = name.replace(/\r?\n/g,"");
        //users_set(id);

        users_name[id] = name;

        await say(`<@${message.user}> さんのユーザー名を ${name} として登録しました`);
    }


    //天気情報
    if (msg.indexOf("天気")!==-1)
    {
        let ary = msg.split(" ");
        if (ary.length<3 || (!between(ary[1], -90,90)) || (!between(ary[2], -180,180))) 
        {
            await say(`その情報では天気情報を教えられません`);
            return;
        };

        //let info = "";
        //const f = (s) => {info = s; return;};
        console.log("処理中");

        weather.clweather(MY_WEATHER_APIKEY, ary[1], ary[2], await say);
        //weather.clweather(MY_WEATHER_APIKEY, ary[1], ary[2], f);
        //console.log("待ってる");
        //while(info==""){}
        //console.log(info);
        
    }

    if (msg.indexOf("絵文字ガチャ")!==-1)
    {
        console.log("ガチャ");

        options = [
            {    token     : USER_TOKEN
            }
          ];
        ls = app.client.emoji.list(options);
        
        console.log(ls);
    }


    

    //ゲーム入力受付
    if (game_mode == 0)
    {
        if (msg.indexOf("数当て")　!==-1)
        {
            await say(`<@${message.user}> 1~1000から私の考えている数字を当ててください`);
            game_mode = GAME_KAZUATE;
            kazuate_ans = parseInt((Math.random()*1000), 10)+1;
            kazuate_turns = 0;
        }
        if (msg.indexOf("じゃんけん") !== -1)
        {
            await say(`<@${message.user}> じゃんけん――...!`);
            game_mode = GAME_JANKEN;
            
        }
        if (msg.indexOf("マインスイーパー") !== -1)
        {
            await say(`<@${message.user}> 調べるマスを「X Y」で指定してくださいね\nXとYは1から9の数字でお願いします`);
            game_mode = GAME_MINES;
            mines_turns = 0;
        }
        if (msg.indexOf("爆弾ゲーム") !== -1 && msg.indexOf("爆弾ゲーム2") == -1)
        {
            await say(`<@${message.user}> 「爆弾ゲーム」は${BOMB_MAX}人で遊ぶゲームです\n参加したい人は「参加」と書いて送信してください`);
            game_mode = GAME_BOMB;
            bomb_players = [message.user];
            await say(bomb_participate(message.user));
        }

        if (msg.indexOf("爆弾ゲーム2") !== -1)
        {
            await say(`<@${message.user}> 「爆弾ゲーム2」は${BOMB2_MAX}人で遊ぶゲームです\n参加したい人は「参加」と書いて送信してください`);
            game_mode = GAME_BOMB2;
            bomb2_players = [message.user];
            await say(bomb_participate(message.user));
        }


        return;
    }

    //数あてゲーム
    if (game_mode == GAME_KAZUATE)
    {
        const rep = msg;
        const ans = kazuate_ans;

        if (rep<ans) {
            kazuate_turns++;
            if (ans-rep>25){
                await say(`<@${message.user}> ちっちゃすぎです`);
            }else{
                await say(`<@${message.user}> ちょっとちっちゃいです`);
            }
            return;
        }

        if (rep>ans) {
            kazuate_turns++;
            if (rep-ans>25){
                await say(`<@${message.user}> おっきすぎです`);
            }else{
                await say(`<@${message.user}> ちょっとだけおっきいです`);
            }
            
            return;
        }

        if (rep==ans) {
            kazuate_turns++;
            const sc = parseInt(50.0/Math.pow(1.2, kazuate_turns-1), 10);
            await say(`<@${message.user}> 正解です、おめでとうございます\n得点は ${sc}点です`);
            users_score_plus(`${message.user}`, sc);

            game_mode = 0;
            await say(users_score_text());
            
            return;
        }

        game_mode = GAME_KAZUATE;
    }


    //じゃんけん
    if (game_mode == GAME_JANKEN)
    {
        const ans = parseInt((Math.random()*100), 10)%3;
        if (ans == 0) await say(`<@${message.user}> グー`);
        if (ans == 1) await say(`<@${message.user}> チョキ`);
        if (ans == 2) await say(`<@${message.user}> パー`);

        let rep = -1;
        if (msg.indexOf("グー") !== -1 || msg.indexOf("ぐー") !== -1) rep = 0;
        if (msg.indexOf("チョキ") !== -1 || msg.indexOf("ちょき") !== -1) rep = 1;
        if (msg.indexOf("パー") !== -1 || msg.indexOf("ぱー") !== -1) rep = 2;

        if (rep===-1) 
        {
            await say(`<@${message.user}> ちゃんと答えてくれないと反応できません`);
            return;
        }

        if (ans ===rep) 
        {
            await say(`<@${message.user}> ――あいこで...!`);
            return;
        }

        game_mode = 0;

        if ((ans == 0 && rep == 2) || (ans == 1 && rep == 0) || (ans == 2 && rep == 1))
        {
            const sc =5;
            await say(`<@${message.user}> 私の負けですね、残念...\n得点は ${sc}点 です`);
            users_score_plus(`${message.user}`, sc);
            await say(users_score_text());
            return;
        }

        await say(`<@${message.user}> 私の勝ちみたいですね、お疲れ様でした`);
        await say(users_score_text());
        return;
    }

    //マインスイーパー
    if (game_mode == GAME_MINES)
    {
        let x0 = msg.charAt(0);
        let y0 = msg.charAt(2);
        let mode = 0;
        const OVER = 1, CLEAR = 2;

        //console.log(`${x0}, ${y0}`);
        
        if (msg.length!=3 || msg[1]!=" " || (!between(x0, 1, 9) || !between(y0, 1, 9))) return; //指定表現じゃないなら戻る
        
        x0--;
        y0--;

        if (mines_turns == 0) mines_init(x0, y0);//初期化
        mines_turns++;
        
        mines_failed = false;
        
        if (mines_matrix[y0][x0]=="1" || mines_matrix[y0][x0]=="3") {
            mode = OVER;//ゲームオーバー
        }else{
            mines_fill(x0-1, y0-1, x0+1, y0+1);
            mines_matrix[y0][x0]=="2";
            if (mines_clearCheck()) mode = CLEAR;
        }
        
        if (mode==0)//普通
        {
            await say(`<@${message.user}>　\n`+mines_drawing());
        }
        else if(mode==OVER)
        {//ゲームオーバー
            let sc = mines_score();
            mines_fill(0, 0, 8, 8);

            await say(`<@${message.user}>　\n`+
                "┏┓┏┳┓　　　┏━┓┏┓┏┓\n"+
                "┃┃┗┻┛　　　┗━┛┃┃┃┃\n"+
                "┃┗━━┓┏━━┓　　┃┃┃┃\n"+
                "┃┏━━┛┗━━┛　　┃┃┗┛\n"+
                "┃┃　　　　　　┏━━┛┃┏┓\n"+
                "┗┛　　　　　　┗━━━┛┗┛ \n"+
                "残念、ゲームオーバーです\n"+           
                `得点は ${sc}点 でした\n`+
                mines_drawing());
            
            users_score_plus(`${message.user}`, sc);
            game_mode = 0;
            await say(users_score_text());
        
        }else if (mode==CLEAR)
        {
            let sc = mines_score()*2;
            mines_fill(0, 0, 8, 8);

            await say(`<@${message.user}>　\n`+
                " ＿人人人人人人人人＿\n"+
                " ＞　ゲームクリア　＜\n"+
                " ￣Y^Y^Y^Y^Y^Y^Y^^Y￣\n"+
                "おめでとうございます\n"+           
                `得点は ${sc}点 でした\n`+
                mines_drawing());
            users_score_plus(`${message.user}`, sc);
            game_mode = 0;
                
            await say(users_score_text());
            }

    }

    


    //爆弾ゲーム
    if (game_mode == GAME_BOMB) 
    {
        if (bomb_players.length<BOMB_MAX)//受付中
        {
            if (msg.indexOf("参加")!= -1 && bomb_players.indexOf(message.user)==-1)
            {
                bomb_players.push(message.user);
                await say(bomb_participate(message.user));
                if (bomb_players.length == BOMB_MAX) 
                {
                    bomb_passing = [];
                        for (let i=0; i<BOMB_MAX; i++) bomb_passing.push(1);
                    bomb_length = 15;
                    bomb_current = 0;
                    await say(`では${BOMB_MAX}人そろったのでゲームを始めます`);
                }
                else
                {
                    return;
                }
            }
            else
            {
                return;
            }
        }
        else //ゲーム処理
        {
            if (message.user != bomb_players[bomb_current]) return;

            if (1<= msg && msg <= 3) //切る
            {
                await say(`<@${bomb_players[bomb_current]}> 導火線を ${msg-0} 切りました`);
                bomb_length -= msg;

                if (bomb_length<=0) //爆発、ゲーム終了
                {
                    await say(`<@${message.user}>　\n`+
                    "┏┓┏┳┓　　　┏━┓┏┓┏┓\n"+
                    "┃┃┗┻┛　　　┗━┛┃┃┃┃\n"+
                    "┃┗━━┓┏━━┓　　┃┃┃┃\n"+
                    "┃┏━━┛┗━━┛　　┃┃┗┛\n"+
                    "┃┃　　　　　　┏━━┛┃┏┓\n"+
                    "┗┛　　　　　　┗━━━┛┗┛ \n"+
                    `残念、${users_name[bomb_players[bomb_current]]}さんの負けです\n`+
                    `${users_name[bomb_players[bomb_current]]}さん以外の皆さんには20点差し上げます`+
                    "")
                    for (let i=0; i<BOMB_MAX; i++)
                    {
                        if (i==bomb_current) continue;
                        users_score_plus(bomb_players[i], 20);
                    }

                    await say(users_score_text());
                    game_mode = 0;
                    return; 
                }

                bomb_current = (bomb_current+1) % BOMB_MAX;
            }
            else if (msg.indexOf("パス")!==-1 && bomb_passing[bomb_current]>0)//パス
            {
                await say(`<@${bomb_players[bomb_current]}> パスを受け付けました`)
                bomb_passing[bomb_current]--;
                bomb_current = (bomb_current+1) % BOMB_MAX;
            }
            else 
            {
                await say(`<@${bomb_players[bomb_current]}> ごめんなさい、意図がよくわかりません`)
                return;
            }
        }
        

        //次回予告処理
        await say(`<@${bomb_players[bomb_current]}> ${users_name[bomb_players[bomb_current]]}さんの番です\n導火線の切りたい長さを「1 ~ 3」で指定してください`)
        if (bomb_passing[bomb_current]>0) 
        {
            await say(`「パス」はあと ${bomb_passing[bomb_current]}回 使えます`);
        }
        else
        {
            await say(`「パス」はもう使えません`);
        }

        
        let ast = "";
        for (let i=0; i<bomb_length-1; i++) ast += "＊";
        await say("\n> 爆"+ast+"　＜ー");
        


    }




    //爆弾ゲーム2
    if (game_mode == GAME_BOMB2) 
    {
        if (bomb2_players.length<BOMB2_MAX)//受付中
        {
            if (msg.indexOf("参加")!= -1 && bomb2_players.indexOf(message.user)==-1)
            {
                bomb2_players.push(message.user);
                await say(bomb2_participate(message.user));
                if (bomb2_players.length == BOMB2_MAX) 
                {
                    bomb2_passing = [];
                        for (let i=0; i<BOMB2_MAX; i++) bomb2_passing.push(2);
                    bomb2_length = 25;
                    bomb2_current = 0;
                    bomb2_stage = 0;
                    bomb2_loser = [];
                    await say(`では${BOMB2_MAX}人そろったのでゲームを始めます`);
                }
                else
                {
                    return;
                }
            }
            else
            {
                return;
            }
        }
        else //ゲーム処理
        {
            if (message.user != bomb2_players[bomb2_current]) return;

            if (1<= msg && msg <= 3) //切る
            {
                await say(`<@${bomb2_players[bomb2_current]}> 導火線を ${msg-0} 切りました`);
                bomb2_length -= msg;

                if ((bomb2_stage==0 && bomb2_length<=15) || 
                    (bomb2_stage==1 && bomb2_length<=5) || 
                    (bomb2_stage==2 && bomb2_length<=0)) //爆発、ゲーム終了
                {
                    await say(`<@${message.user}>　\n`+
                    "┏┓┏┳┓　　　┏━┓┏┓┏┓\n"+
                    "┃┃┗┻┛　　　┗━┛┃┃┃┃\n"+
                    "┃┗━━┓┏━━┓　　┃┃┃┃\n"+
                    "┃┏━━┛┗━━┛　　┃┃┗┛\n"+
                    "┃┃　　　　　　┏━━┛┃┏┓\n"+
                    "┗┛　　　　　　┗━━━┛┗┛ \n"+
                    `残念、${users_name[bomb2_players[bomb2_current]]}さんは脱落しました\n`+
                    "")
                    bomb2_loser.push(bomb2_current);
                    bomb2_stage++;
                }

                if (bomb2_length<=0) //爆発、ゲーム終了
                {
                    for (let i=0; i<BOMB2_MAX; i++)
                    {
                        if (bomb2_loser.indexOf(i)==-1) bomb2_loser.push(i);
                    }
                    
                    await say(`結果発表です\n`+
                        `> 4位 ${bomb2_players[bomb2_loser[0]]}さん 0点\n`+
                        `> 3位 ${bomb2_players[bomb2_loser[1]]}さん 15点\n`+
                        `> 2位 ${bomb2_players[bomb2_loser[2]]}さん 60点\n`+
                        `> 1位 ${bomb2_players[bomb2_loser[3]]}さん 100点\n`+
                        `です。お疲れ様でした`
                        );

                    users_score_plus(bomb2_players[bomb2_loser[0]], 0);
                    users_score_plus(bomb2_players[bomb2_loser[1]], 15);
                    users_score_plus(bomb2_players[bomb2_loser[2]], 60);
                    users_score_plus(bomb2_players[bomb2_loser[3]], 100);
                    await say(users_score_text());
                    game_mode = 0;
                    return; 
                }
                
                while (true)
                {//次の人を決める
                    bomb2_current = (bomb2_current+1) % BOMB2_MAX;
                    if (bomb2_loser.indexOf(bomb2_current)==-1) break;
                }
            }
            else if (msg.indexOf("パス")!==-1 && bomb2_passing[bomb2_current]>0)//パス
            {
                await say(`<@${bomb2_players[bomb2_current]}> パスを受け付けました`)
                bomb2_passing[bomb2_current]--;
                while (true)
                {//次の人を決める
                    bomb2_current = (bomb2_current+1) % BOMB2_MAX;
                    if (bomb2_loser.indexOf(bomb2_current)==-1) break;
                }
            }
            else 
            {
                await say(`<@${bomb2_players[bomb2_current]}> ごめんなさい、意図がよくわかりません`)
                return;
            }
        }
        

        //次回予告処理
        await say(`<@${bomb2_players[bomb2_current]}> ${users_name[bomb2_players[bomb2_current]]}さんの番です\n導火線の切りたい長さを「1 ~ 3」で指定してください`)
        if (bomb2_passing[bomb2_current]>0) 
        {
            await say(`「パス」はあと ${bomb2_passing[bomb2_current]}回 使えます`);
        }
        else
        {
            await say(`「パス」はもう使えません`);
        }

        
        let l = "爆＊＊＊＊"+"爆＊＊＊＊"+"＊＊＊＊＊"+"爆＊＊＊＊"+"＊＊＊＊＊";
        l = l.substr(0, bomb2_length);
        await say("\n> "+l+"　＜ー");
        


    }


}
);



//乱数返却
function rand(n)
{
    return parseInt((Math.random()*n), 10);
}

//2値の間かどうか
function between(n, min, max)
{
    return (min<=n && n <= max);
}

//文字列か判定
function isString(obj) {
    return typeof (obj) == "string" || obj instanceof String;
};

//ユーザーのスコアを追加
function users_score_plus(id, sc)
{
    users_score[id] += sc;
    //console.log("score_plus ok");
}


//ユーザー新規登録
function users_set(id)
{
    if (!(id in users_score)) 
    {
        users_score[id] = 0;
        users_name[id]=id;
    }
}


//ユーザースコアを表示する文
function users_score_text(name, sc)
{
    if (Object.keys(users_score).length==0) return " ";

    //console.log("user_score_text 1");

    let l="";
    var array = Object.keys(users_score).map((k)=>({ key: k, value: users_score[k] }));

    //console.log("user_score_text 2");

    l="これまでの参加者みなさんの成績は\n"
    for (var id in users_score)
    {
        l += `${users_name[id]} 様: `+ users_score[id] + "点\n"
    }
    l+="です"

    data_save();
    //console.log("user_score_text 3");
    return l;
}





//マインスイーパー行列初期化
function mines_init(x0, y0)
{
    //console.log(`mines_init start`);
    //初期化
    for (var i=0; i<9; i++)
    {
        mines_matrix[i] = "000000000";
    }

    //console.log(`mines_init mines setting`);
    //地雷設置
    for (var i=0; i<10; i++)
    {
        while (true)
        {
            let x=rand(9), y=rand(9);
            //console.log(`${x}, ${y}`);
            if (mines_matrix[y].charAt(x)=='0' && !(x==x0 && y== y0)) //地雷設置
            {
                //mines_matrix[y].charAt(x) = '1';
                //console.log(mines_matrix[y]);
                mines_matrix[y] = AtReplace(mines_matrix[y], x, "1"); //1で地雷, 2で済マス, 3で地雷開封, 4で数字マス
                //console.log(mines_matrix[y]);
                break;
            }
        }
    }

    //console.log(`mines_init mines counting`);
    //周りの地雷数値化
    for (var y=0; y<9; y++)
    {
        let s="";
        for (var x=0; x<9; x++)
        {
            let n=0;
            if (mines_matrix_get(x-1, y-1)=="1") n++;
            if (mines_matrix_get(x-0, y-1)=="1") n++;
            if (mines_matrix_get(x+1, y-1)=="1") n++;
            if (mines_matrix_get(x-1, y-0)=="1") n++;
            if (mines_matrix_get(x+1, y-0)=="1") n++;
            if (mines_matrix_get(x-1, y+1)=="1") n++;
            if (mines_matrix_get(x-0, y+1)=="1") n++;
            if (mines_matrix_get(x+1, y+1)=="1") n++;
            s +=  "０１２３４５６７８９"[n];
        }
        mines_matrixNumberd[y] = s;
    }
    //console.log("mines_init succeeded");
}


function AtReplace(str, begin, replace_str)
{
    let before = "";
    if (begin - 1>=0) before = str.slice(0, begin - 1 + 1);

    let after = "";
    if (begin+replace_str.length<=str.length-1) after = str.slice(begin+replace_str.length, str.length);

    //console.log(before+":"+after);
    let ret = before + replace_str + after;
    return ret;
}

//マスを済にする
function mines_fill(x1, y1, x2, y2)
{
    for (var x=x1; x<=x2; x++)
    {
        for (var y=y1; y<=y2; y++)
        {
            if (mines_matrix_get(x, y)=="0") mines_matrix_set(x, y, "4");
            if (mines_matrix_get(x, y)=="1") mines_matrix_set(x, y, "3");
        }
    }
}

//スコア
function mines_score()
{
    let s=0;
    for (var x=0; x<9; x++)
    {
        for (var y=0; y<9; y++)
        {
            if (mines_matrix[y][x]=="2" || mines_matrix[y][x]=="4") s++;
        }
    }
    return s;
}

function mines_matrix_set(x, y, c)
{
    if (x<0 || 9<=x) return;
    if (y<0 || 9<=y) return;
    //mines_matrix[y][x] = c;
    mines_matrix[y] = AtReplace(mines_matrix[y], x, c);
}

function mines_matrix_get(x, y)
{
    if (x<0 || 9<=x) return "";
    if (y<0 || 9<=y) return "";
    return mines_matrix[y][x];
}


function mines_clearCheck()
{
    for (var y=0; y<9; y++)
    {
        for (var x=0; x<9; x++)
        {
            if (mines_matrix[y][x]=='0') return false;
        }
    }
    return true;
}




//マインスイーパー画面描画
function mines_drawing()
{
    mines_display[0] = "　Ｘ１２３４５６７８９";
    mines_display[1] = "Ｙ　－－－－－－－－－"
    let l="";
    for (var y=0; y<9; y++)
    {
        mines_display[2+y] = "１２３４５６７８９"[y] + "｜";

        for (var x=0; x<9; x++)
        {
            if (mines_matrix[y][x]=='0') {mines_display[2+y] += "　"; continue}
            if (mines_matrix[y][x]=='1') {mines_display[2+y] += "　"; continue}
            if (mines_matrix[y][x]=='2') {mines_display[2+y] += "済"; continue}
            if (mines_matrix[y][x]=='3') {mines_display[2+y] += "雷"; continue}
            if (mines_matrix[y][x]=='4') {mines_display[2+y] += mines_matrixNumberd[y][x]; continue}
        }
    }

    for (y=0;y<2+9;y++)
    {
        l += mines_display[y]+"\n";
    }
    return l;
}


function bomb_participate(id)
{
    return `<@${id}> ${users_name[id]}さんの参加を受け付けました`
}

function bomb2_participate(id)
{
    return bomb_participate(id);
}







//セーブデータ
function data_load()
{
    if (!fs.existsSync(data_pass)) return;
    let data = fs.readFileSync(data_pass, "utf-8");
    
    //console.log(data);
    //console.log("通貨");

    //let lines = data.split(/\r?\n/);
    let lines = data.split(/\r?\n/g);
      
    for (var i=0; i<lines.length/3; i++)
    {
        let id = lines[i*3];
        users_name[id] = lines[i*3+1];
        users_score[id] = Number(lines[i*3+2]);
    }
}

function data_save()
{
    let l="";
    let i=0;
    for (let id in users_score)
    {
        if (i>0) l+="\n";

        l += `${id}\n`;
        l += `${users_name[id]}\n`;
        l += `${users_score[id]}`;

        i++;
    }

    fs.writeFileSync(data_pass, l);

}





//起動処理
(async () => {
  // Start your app
    //await app.start(process.env.PORT || 3000);
    await app.start();

    console.log('(^^)/~~~Bolt app is running!');
})();








