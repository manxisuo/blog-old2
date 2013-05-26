var POST_ROOT = "post";
var WIDGET_ROOT = "widget";
var COMMENT_WIDGET = 'uyan_comment';
var DEFAULT_TITLE = '路漫漫';
var DEFAULT_BG_COLOR = '#D2F4FE';
var mainWrapper = '<div class="posts round-corner" />';
var INIT_POST_COUNT = 5;
/**
 * 文章列表缓存。
 * 注意：从index.json得到的每个对象称为article。Post对象是它的扩展。
 */
var articleList = [];

// 数组遍历
Array.prototype.each = function(handle) {
    for (var i = 0; i < this.length; i++) {
        handle(this[i], i);
    }
}

Array.prototype.contains = function(item) {
    var _contain = false;
    this.each(function(element) {
        if (element == item)_contain = true;
    });
    return _contain;
}

// 集合类
function Set() {
    this.c = [];
}

Set.prototype.contains = function(item) {
    return this.c.contains(item);
}

Set.prototype.add = function(item) {
    if (!this.contains(item))this.c.push(item);
}

Set.prototype.addAll = function(items) {
    var _this = this;
    items.each(function(item) {
        _this.add(item);
    });
}

Set.prototype.toArray = function() {
    return this.c;
}

// Post类
function Post(param) {
    if (typeof param == 'string') {
        this.name = param;
        this.url = Post.getUrl(this.name);
        this.index = Post.getIndex(this.name);
    }
    else if(typeof param == 'number') {
        this.index = param;
        this.name = articleList[this.index].name;
        this.url = Post.getUrl(this.name);
    }
    else {
        throw Error('illegal param');
    }

    if (this.index != -1) {
        var article = articleList[this.index];
        this.title = article.title;
        this.tags = article.tags;
        this.date = article.date;
        this.existing = true;
    }
    else {
        this.existing = false;
    }
}

// 获取Post
Post.prototype.get = function(callback) {
    var box = $('<div class="post-content" />');
    $.get(this.url, function(content) {
        // 解析Markdown为HTML
        var html = new Showdown.converter().makeHtml(content); 
        //var html = markdown.toHTML(content); 
        
        // 为高亮添加语言类型
        html = html.replace(/<p>@(\w+)#?(\w*)<\/p>[\n|\s|\t]*<pre><code>/g, 
            '<pre><code class="$1" id="$2">')
        
        // 载入容器
        box.html(html);
        
        // 高亮
        hljs.highlightBlock(box[0]);
        
        // 回调
        callback(box);
    });
}

// 据名称，获取post的URL
Post.getUrl = function(name) {
    return POST_ROOT + '/' + name + '.md';
}

// 根据名称，获取post对象在列表中的索引
Post.getIndex = function(name) {
    var index = -1;
    articleList.each(function(article, i) {
        if (article.name == name) index = i;
    });

    return index;
}

// Post的分页器
function PostPaginator(post) {
    this.post = post;
}

PostPaginator.prototype.get = function() {
    var box = $('<div class="post-paging" />');
    var prevWrapper = $('<span class="paging-prev"><a /></span>');
    var nextWrapper = $('<span class="paging-next"><a /></span>');
    
    var n = this.post.index;

    if (n > 0) {
        var prev = articleList[n-1];
        $('a', prevWrapper).attr('href', '#!' + prev.name)
            .attr('title', prev.title).text('上一篇');
    }
    else {
        $('a', prevWrapper).text('下一篇').addClass('disable-link');
    }
    
    if (n < articleList.length - 1) {
        var next = articleList[n+1];
        $('a', nextWrapper).attr('href', '#!' + next.name)
            .attr('title', next.title).text('下一篇');
    }
    else {
        $('a', nextWrapper).text('上一篇').addClass('disable-link');
    }
    
    box.append(prevWrapper).append(nextWrapper);
    return box;
};

// Post的标签
function Tags(tagNames) {
    this.tagNames = tagNames;
}

Tags.prototype.get = function() {
    var box = $('<span class="post-tags" />');
    this.tagNames.each(function(tagName) {
        box.append($('<a />').attr('href', '#@' + tagName).text(tagName));
    });
    return box;
}

// Post列表
function PostLines(articleList) {
    this.articleList = articleList;
}

PostLines.prototype.get = function() {
    var box = $('<ul class="post-lines" />');
    
    this.articleList.each(function(article, i) {
        var postE = $('<li class="post-li" />');
        
        var titleE = $('<a class="post-title" />').text(article.title);
        titleE.attr('title', article.title);
        titleE.attr('href', '#!' + article.name);
        
        var dateE = $('<span class="post-date" />').text(article.date);
        
        var tagsE = new Tags(article.tags).get();
        
        postE.append(titleE).append(dateE).append(tagsE);
        box.append(postE);
    });
    
    return box;
}

// 获取文章列表
function initArticleList(callback) {
    if (null == articleList || articleList.length == 0) {
        $.get(POST_ROOT + '/index.json', function(articles) {
            articleList = articles;
            if(callback)callback();
        });
    }
    else {
        if(callback)callback();
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

function initBgColor() {
    if (local('bg-color') == undefined) {
        local('bg-color', DEFAULT_BG_COLOR);
        $('html').css('background-color', DEFAULT_BG_COLOR);
    }
    else 
        $('html').css('background-color', local('bg-color'));
}

function min(a, b) {
    return a > b ? b : a;
}

// 设置页面标题
function setTitle(title) {
    document.title = title;
}

// 根据Tag，获取article列表。
function getArticlesByTag(tagName) {
    var articles = [];
    articleList.each(function(atcl) {
        atcl.tags.each(function(tag) {
            if (tagName == tag)articles.push(atcl);
        });
    });

    return articles;
}

function loadAllPostList() {
    setTitle(DEFAULT_TITLE);
    var wrapper = $(mainWrapper);
    wrapper.append($('<div id="post-desc" />').text('所有文章'));
    wrapper.append(new PostLines(articleList).get());
    $('#main').html(wrapper);
}

function loadPostListByTag(tag) {
    var articleList = getArticlesByTag(tag);
    setTitle('标签: ' + tag);
    var wrapper = $(mainWrapper);
    wrapper.append($('<div id="post-desc" />').text('标签: ' + tag));
    wrapper.append(new PostLines(articleList).get());
    $('#main').html(wrapper);
}

// 什么也没找到
function loadNothing() {
    setTitle('什么也没找到');
    var wrapper = $(mainWrapper);
    wrapper.append($('<div id="post-desc" />').text('什么也没找到'));
    $('#main').html(wrapper);
}

function loadSomePosts() {
    $('#main').html('');  
    var wrapper;
    var wrappers = new Array(min(INIT_POST_COUNT, articleList.length));
    wrappers.each(function(item, i) {
        wrapper = $(mainWrapper);
        wrapper.hide();
        $('#main').append(wrapper);
        
        // 为了保证文章的展示顺序
         wrappers[i] = wrapper;
    });
    
    // 初始展示的文章
    articleList.slice(0, INIT_POST_COUNT).each(function(article, i) {
        var wrapper = $(mainWrapper);
        var post = new Post(i);
        if (post.existing) {
            post.get(function(content) {
                setTitle(post.title);
                var desc = $('<div id="post-desc" />').text(post.title);
                desc.append($('<span class="post-date">' + post.date + '</span>'));
                wrappers[i].append(desc);
                wrappers[i].append(content);
                wrappers[i].show();
            });
        }
        else {
            loadNothing();
        }
    });
}

function loadPost(name) {
    var post = new Post(name);
    if (post.existing) {
        var wrapper = $(mainWrapper);
        post.get(function(content) {
            setTitle(post.title);
            var desc = $('<div id="post-desc" />').text(post.title);
            desc.append($('<span class="post-date">' + post.date + '</span>'));
            wrapper.append(desc);
            wrapper.append(content);
            wrapper.append(new PostPaginator(post).get());
            $('#main').html(wrapper);
        });
    }
    else {
        loadNothing();
    }
}

// 路由
function handleHashChange(hashcode) {
    if ('' == hashcode || '#!' == hashcode) {
        loadSomePosts();
    }
    else if ('#!all' == hashcode) {
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
        loadPostListByTag(tag);
    }
    else {
        loadNothing();
    }
}

function handleKeyup(keyCode) {
    var href;
    if (keyCode == 37) {
        href = $('.paging-prev a').attr('href');
    }
    else if (keyCode == 39) {
        href = $('.paging-next a').attr('href');
    }
    if (href) {
        location.href = href;
    }
}

$(function(){
    // 初始化页面背景
    initBgColor();
    
    // hash change event
    $(window).hashchange(function(){
        handleHashChange(location.hash);
    });
    
    initArticleList(function() {
        $(window).hashchange();
        
        // load widget
        loadAllWidget(); 
    });
    
    // 注册keyup事件监听器
    $(document).on('keyup', function(e) {
        handleKeyup(e.keyCode);
    });
});
