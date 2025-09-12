/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package events;

/**
 *
 * @author mufufu
 */
public class ImportUpdate {


    private String msg;
    private String wsid;
    
    public ImportUpdate(String msg, String wsid) {
        this.msg = msg;
        this.wsid = wsid;
    }
    
    /**
     * @return the msg
     */
    public String getMsg() {
        return msg;
    }

    /**
     * @param msg the msg to set
     */
    public void setMsg(String msg) {
        this.msg = msg;
    }

    /**
     * @return the wsid
     */
    public String getWsid() {
        return wsid;
    }

    /**
     * @param wsid the wsid to set
     */
    public void setWsid(String wsid) {
        this.wsid = wsid;
    }

        
}
