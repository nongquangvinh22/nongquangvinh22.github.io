(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const bank = window.HISTORY_BANK || [];
  const topics = window.HISTORY_TOPICS || [];
  const letters = ["A","B","C","D"];
  const state = {current:null, queue:[], time:15, timer:null, revealed:false, scores:{}, seen:new Set(), log:[], correctTotal:0};
  const els = {
    topic:$("topicFilter"), difficulty:$("difficultyFilter"), time:$("timeLimit"),
    question:$("questionText"), questionTopic:$("questionTopic"), counter:$("questionCounter"),
    options:$("options"), timerBar:$("timerBar"), timerText:$("timerText"),
    message:$("answerMessage"), explanation:$("explanation"),
    start:$("startBtn"), next:$("nextBtn"), reveal:$("revealBtn"),
    form:$("commentForm"), name:$("viewerName"), comment:$("viewerComment"),
    log:$("commentLog"), board:$("leaderboard"), mini:$("miniLeaderboard"),
    playerCount:$("playerCount"), totalCorrect:$("totalCorrect"), reset:$("resetBtn")
  };
  if(bank.length!==3000){
    els.question.textContent="Không tải được ngân hàng 3.000 câu. Hãy kiểm tra tệp question-bank.js.";
    els.message.textContent="Lỗi dữ liệu: số câu hiện có là "+bank.length+".";
    els.start.disabled=true;
    return;
  }
  topics.filter(t=>t!=="Tất cả").forEach(t=>{
    const op=document.createElement("option"); op.value=t; op.textContent=t; els.topic.append(op);
  });
  const shuffle=a=>{
    const x=a.slice();
    for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}
    return x;
  };
  const eligible=()=>bank.filter(q=>(els.topic.value==="Tất cả"||q.topic===els.topic.value)&&(!Number(els.difficulty.value)||q.difficulty===Number(els.difficulty.value)));
  function stopTimer(){if(state.timer){clearInterval(state.timer);state.timer=null;}}
  function setTime(value){
    state.time=value;const total=Number(els.time.value);
    els.timerText.textContent=String(value);
    els.timerBar.style.width=Math.max(0,value/total*100)+"%";
    els.timerBar.style.background=value<=5?"linear-gradient(90deg,#bb5e5e,#f0a08b)":"linear-gradient(90deg,#d5a44e,#f3d995)";
  }
  function runTimer(){
    stopTimer();state.time=Number(els.time.value);setTime(state.time);
    state.timer=setInterval(()=>{
      state.time--;setTime(state.time);
      if(state.time<=0){stopTimer();els.message.textContent="Hết giờ! Có thể hiện đáp án hoặc sang câu tiếp theo.";els.message.className="answer-message bad";}
    },1000);
  }
  function loadNext(){
    stopTimer();state.revealed=false;
    const candidates=eligible();
    if(!candidates.length){els.question.textContent="Không có câu hỏi phù hợp bộ lọc.";return;}
    if(!state.queue.length || state.queue.some(id=>!candidates.some(q=>q.id===id))){
      state.queue=shuffle(candidates.map(q=>q.id));
    }
    const id=state.queue.pop();
    state.current=candidates.find(q=>q.id===id);
    els.question.textContent=state.current.question;
    els.questionTopic.textContent=state.current.topic.toUpperCase();
    els.counter.textContent="MÃ CÂU "+state.current.id+" · CÒN "+state.queue.length+" LƯỢT TRONG VÒNG";
    els.options.replaceChildren();
    state.current.options.forEach((opt,i)=>{
      const button=document.createElement("button");
      button.className="option";
      const letter=document.createElement("span");letter.className="letter";letter.textContent=letters[i];
      const text=document.createElement("span");text.className="option-text";text.textContent=opt;
      button.append(letter,text);
      button.addEventListener("click",()=>processComment("Người chơi tại máy",letters[i]));
      els.options.append(button);
    });
    els.message.textContent="Đang nhận câu trả lời A, B, C hoặc D.";
    els.message.className="answer-message";
    els.explanation.hidden=true;els.explanation.textContent="";
    els.start.disabled=true;els.next.disabled=false;els.reveal.disabled=false;
    runTimer();
  }
  function reveal(){
    if(!state.current||state.revealed)return;
    state.revealed=true;stopTimer();
    const buttons=[...els.options.querySelectorAll(".option")];
    buttons.forEach((b,i)=>{
      b.disabled=true;
      if(i===state.current.correctIndex)b.classList.add("correct");
    });
    const correct=letters[state.current.correctIndex];
    els.message.textContent="Đáp án chính xác: "+correct+" — "+state.current.answer;
    els.message.className="answer-message good";
    els.explanation.textContent=state.current.explanation;
    els.explanation.hidden=false;
    els.reveal.disabled=true;els.start.disabled=false;
  }
  function processComment(name,raw){
    const user=(name||"Khách").trim().slice(0,24)||"Khách";
    const value=(raw||"").trim().toUpperCase();
    if(!state.current){addLog(user,raw,"Hãy nhấn Bắt đầu trước nhé.","bad");return;}
    if(!/^[ABCD]$/.test(value)){addLog(user,raw,"Bình luận mô phỏng chỉ nhận A, B, C hoặc D.","bad");return;}
    const key=state.current.id+"|"+user.toLocaleLowerCase("vi");
    if(state.seen.has(key)){addLog(user,value,"Bạn đã trả lời câu này rồi.","bad");return;}
    state.seen.add(key);
    const good=value===letters[state.current.correctIndex];
    if(!state.scores[user])state.scores[user]={score:0,correct:0,attempts:0};
    state.scores[user].attempts++;
    if(good){state.scores[user].score+=10;state.scores[user].correct++;state.correctTotal++;}
    const feedback=good?"Chính xác! +10 điểm.":"Chưa chính xác. Đáp án sẽ được công bố khi chốt câu.";
    addLog(user,value,feedback,good?"good":"bad");
    renderScores();
  }
  function addLog(name,comment,feedback,kind){
    state.log.unshift({name,comment:String(comment||""),feedback,kind});
    state.log=state.log.slice(0,12);
    els.log.replaceChildren();
    state.log.forEach(item=>{
      const row=document.createElement("div");row.className="comment-item "+item.kind;
      const line=document.createElement("div");
      const strong=document.createElement("strong");strong.textContent=item.name;
      line.append(strong,document.createTextNode(" bình luận: "+item.comment));
      const small=document.createElement("small");small.textContent="Hệ thống: "+item.feedback;
      row.append(line,small);els.log.append(row);
    });
  }
  function renderScores(){
    const entries=Object.entries(state.scores).sort((a,b)=>b[1].score-a[1].score||b[1].correct-a[1].correct);
    els.playerCount.textContent=String(entries.length);els.totalCorrect.textContent=String(state.correctTotal);
    els.board.replaceChildren();els.mini.replaceChildren();
    if(!entries.length){
      const li=document.createElement("li");li.className="empty";li.textContent="Bảng điểm sẽ xuất hiện tại đây.";els.board.append(li);
      const p=document.createElement("p");p.className="empty";p.textContent="Chưa có điểm.";els.mini.append(p);return;
    }
    entries.slice(0,10).forEach(([name,data])=>{
      const li=document.createElement("li");
      const who=document.createElement("span");who.textContent=name;
      const score=document.createElement("b");score.textContent=data.score+" điểm";
      const stat=document.createElement("small");stat.textContent=data.correct+" đúng";
      li.append(who,score,stat);els.board.append(li);
    });
    entries.slice(0,5).forEach(([name,data],i)=>{
      const row=document.createElement("div");row.className="mini-player";
      row.textContent=(i+1)+". "+name+" — "+data.score+" điểm";els.mini.append(row);
    });
  }
  els.start.addEventListener("click",loadNext);
  els.next.addEventListener("click",loadNext);
  els.reveal.addEventListener("click",reveal);
  els.form.addEventListener("submit",e=>{
    e.preventDefault();processComment(els.name.value,els.comment.value);els.comment.value="";els.comment.focus();
  });
  els.time.addEventListener("change",()=>{if(state.current&&!state.revealed)runTimer();});
  els.topic.addEventListener("change",()=>{state.queue=[];if(state.current)loadNext();});
  els.difficulty.addEventListener("change",()=>{state.queue=[];if(state.current)loadNext();});
  els.reset.addEventListener("click",()=>{
    if(!confirm("Xóa toàn bộ điểm và lịch sử bình luận mô phỏng?"))return;
    state.scores={};state.seen.clear();state.correctTotal=0;state.log=[];els.log.replaceChildren();renderScores();
  });
  document.addEventListener("keydown",e=>{
    if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
    if(["a","b","c","d"].includes(e.key.toLowerCase()))processComment("Người chơi tại máy",e.key);
  });
  renderScores();
  els.questionTopic.textContent="SẴN SÀNG";
  els.counter.textContent="3.000 LƯỢT CÂU HỎI";
})();