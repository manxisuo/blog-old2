var POST_ROOT = "post";
var WIDGET_ROOT = "widget";
var COMMENT_WIDGET = 'uyan_comment';
var DEFAULT_TITLE = '路漫漫';
var DEFAULT_BG_COLOR = '#D2F4FE';

// post列表缓存
var postList = [];

// 打印日志
function log(msg) {
    if(console && console.log)console.log(msg);
}

// 设置页面标题
function setTitle(title) {
    document.title = title;
}

// 根据名称，获取post对象在列表中的索引。所谓名称，即md文件的名称。
function getPostIndexByName(postName) {
    for (var i = 0; i < postList.length; i++) {
        if (postList[i].name == postName) return i;
    }
    return -1;
}

// 根据Tag，获取post对象列表。
function getPostsByTag(tag) {
    var posts = [];
    for (var i = 0; i < postList.length; i++) {
        var tags = postList[i].tags;
        for (var j = 0; j < tags.length; j++) {
            if (tags[j] == tag)posts.push(postList[i]);
        }
    }
    return posts;
}

// 获取文章列表
function loadPostList(callback) {
    if (null == postList || postList.length == 0) {
        $.get(POST_ROOT + '/index.json', function(posts) { 
            postList = posts;
            if(callback)callback(postList);
        });
    } else {
        if(callback)callback(postList);
    }
}

// 什么也没找到
function loadNothing() {
    setTitle('什么也没找到');
    $('#post-desc').html('什么也没找到');
    $('#post-content').html('');
    $('#post-paging').hide();
}

// 加载某一篇文章
function loadPost(postName) {
    var n = getPostIndexByName(postName);
    if (n < 0) {
        loadNothing();
        return;
    }
    
    var post = postList[n];
    var postUrl = POST_ROOT + '/' + postName + '.md';
    $.get(postUrl, function(postData) {
        var html = new Showdown.converter().makeHtml(postData); 
        // 为高亮添加语言类型
        //html = html.replace(/<p>@(\w+)<\/p>\n+<pre><code>/g, '<pre><code class="$1">');
        html = html.replace(/<p>@(\w+)#?(\w*)<\/p>[\n|\s|\t]*<pre><code>/g, '<pre><code class="$1" id="$2">')
        setTitle(post.title);
        $('#post-content').html(html);
        $('#post-desc').html(post.title).append($('<span class="post-date">' + post.date + '</span>'));
        
        // highlight
        hljs.highlightBlock($('#post-content')[0]);
        
        loadPagingForPost(n);
        $('#post-paging').show();
    });
}

function loadPagingForPost(n) {
    if (n > 0) {
        var prevPost = postList[n-1];
        enableLink($('#paging-prev a'), '#!' + prevPost.name, prevPost.title);
    }
    else {
        disableLink($('#paging-prev a'));
    }
    
    if (n < postList.length - 1) {
        var nextPost = postList[n+1];
        enableLink($('#paging-next a'), '#!' + nextPost.name, nextPost.title);
    }
    else {
        disableLink($('#paging-next a'));
    }
}

function enableLink(link, url, title) {
    link.attr('href', url).attr('title', title);
    link.removeAttr('disabled');
    link.removeClass('disable-link');
}

function disableLink(link) {
    link.removeAttr('href').removeAttr('title');
    link.attr('disabled', 'disabled');
    link.addClass('disable-link');
}

// 加载符合标签的文章列表
function loadTag(tag) {
    $('#post-paging').hide();
    var posts = getPostsByTag(tag);
    createPostList(posts);
    
    $('#post-desc').text('标签: ' + tag);
    
}

// 加载所有文章列表
function loadAllPostList() {
    $('#post-paging').hide();
    setTitle(DEFAULT_TITLE);
    createPostList(postList);
}

// 生成post列表
function createPostList(posts) {
    var indexE = $('<ul class="post-ul" />');
    
    for (var i = 0; i < posts.length; i++) {
        var post = posts[i];

        var postE = $('<li class="post-li" />');
        
        var titleE = $('<a class="post-title" />').text(post.title);
        titleE.attr('title', post.title);
        titleE.attr('href', '#!' + post.name);
        
        var dateE = $('<span class="post-date" />').text(post.date);
        
        var tagsE = $('<span class="post-tags" />');
        var tags = post.tags;
        for (var j = 0; j < tags.length;  j++) {
            var tag = tags[j];
            var tagE = $('<a />').text(tag).attr('href', '#@' + decodeURI(tag));
            tagsE.append(tagE);
        }
        
        postE.append(titleE).append(dateE).append(tagsE);
        indexE.append(postE);
        $('#post-content').html(indexE);
        $('#post-desc').text('所有文章');
    }
}

// 点击链接时
function handleNavigate(hashcode) {
    if ('' == hashcode || '#!' == hashcode) {
        loadAllPostList();
    }
    else if ('#!about' == hashcode) {
        loadPost('about');
    }
    else if (/^#!\d{4}-\d{2}-\d{2}.*/.test(hashcode)) {
        var postName = hashcode.substring(2);
        loadPost(postName);
    }
    else if (/^#@.+/.test(hashcode)) {
        var tag = hashcode.substring(2);
        setTitle('标签: ' + tag);
        loadTag(tag);
    }
    else {
        loadNothing();
    }
}

// 加载页面上的所有插件
function loadAllWidget() {
    $('.widget').each(function() {
        var widgetName = $.trim($(this).text());
        var _this = $(this);
        loadWidget(_this, widgetName, function() {
            _this.show();
        });
    });
}

// 加载某个插件
function loadWidget(box, widgetName, callback) {
    var url = WIDGET_ROOT + '/' + widgetName + '.html';
    $.get(url, function(data){
        box.html(data);
        box.find('script').each(function() {
            //executeInnerJS($(this).text());
            $(this).remove();
        });
        box.find('style').each(function() {
            //$(this).remove(); 
        });
        if(callback)callback();
    });
}

// 动态执行内联脚本
function executeInnerJS(jsText) {
    var sc = $('<script />')
    sc.text(jsText);
    $('body').append(sc);
    sc.remove();
}

// 本地存储的存和取
function local() {
    if (localStorage) {
        switch (arguments.length) {
            case 1: return localStorage[arguments[0]]; 
                    break;
            case 2: localStorage[arguments[0]] = arguments[1];
        }
    }
    else {
        return undefined;
    }
}

function init() {
    if (local('bg-color') == undefined) {
        local('bg-color', DEFAULT_BG_COLOR);
        $('html').css('background-color', DEFAULT_BG_COLOR);
    }
    else 
        $('html').css('background-color', local('bg-color'));
}

$(function(){
    // init
    init();
    
    // hash change event
    $(window).hashchange(function(){
        loadPostList(function() {
            handleNavigate(location.hash);
            
            // 重载comment
            //loadWidget($('#comment'), COMMENT_WIDGET);    
        });
    });
    
    $(window).hashchange();
    
    // load widget
    loadAllWidget();
});
