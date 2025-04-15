

import java.util.List;

public class society extends Entity {

	/**
	 * 
	 */
	public List<event> event;
	/**
	 * 
	 */
	public List<teammember> teammember;
	/**
	 * Getter of event
	 */
	public List<event> getEvent() {
	 	 return event; 
	}
	/**
	 * Setter of event
	 */
	public void setEvent(List<event> event) { 
		 this.event = event; 
	}
	/**
	 * Getter of teammember
	 */
	public List<teammember> getTeammember() {
	 	 return teammember; 
	}
	/**
	 * Setter of teammember
	 */
	public void setTeammember(List<teammember> teammember) { 
		 this.teammember = teammember; 
	} 

}