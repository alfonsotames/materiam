/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package websockets;

import events.EventQualifier;
import events.ImportUpdate;
import jakarta.ejb.Singleton;
import jakarta.enterprise.event.Observes;
import jakarta.websocket.OnError;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author mufufu
 */
@Singleton
@ServerEndpoint("/notifier")
public class Notifier {
    private static final Map<String, Session> sessions = Collections.synchronizedMap(new HashMap<>());
    
    @OnError
    public void onError(Throwable t) {
        System.out.println("An error ocurred");
    }

    @OnOpen
    public void onOpen(final Session session) {
        try {
            session.getBasicRemote().sendText("SESSIONID:"+session.getId());
            
            sessions.put(session.getId(), session);
        } catch (Exception ex) {
            Logger.getLogger(Notifier.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
    public void onCDIEvent(@Observes @EventQualifier ImportUpdate iu) {
        System.out.println("The Notifier received a CDI Event!");
        
        Session s = sessions.get(iu.getWsid());
        try {
            System.out.println("Sending message to session "+s.getId());
            s.getBasicRemote().sendText(iu.getMsg());
        } catch (java.lang.IllegalStateException | IOException e) {
            Logger.getLogger(Notifier.class.getName()).log(Level.SEVERE, "Carefully removing disconnected client {0}", s.getId());
            sessions.remove(iu.getWsid());
        } 
    }     
    
}
